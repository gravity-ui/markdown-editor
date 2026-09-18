import {invertedEffects, isolateHistory} from '@codemirror/commands';
import {
    Annotation,
    type ChangeDesc,
    type ChangeSpec,
    EditorState,
    Prec,
    StateEffect,
    StateField,
    Transaction,
} from '@codemirror/state';
import {EditorView, ViewPlugin} from '@codemirror/view';
import {v4 as uuid} from 'uuid';

import {extendedMarkdownLanguage} from '../../../markup/codemirror/markdown-syntax';
import {encodeResourceUrl, validateResourceUrl} from '../prosemirror/document-utils';
import {resourceKey} from '../tracking';
import type {ResourceOccurrence, ResourceTarget} from '../tracking';
import type {ResourceReplacementSource} from '../types';

import {fileResourceHandler, imageResourceHandler} from './builtins';
import {codeMirrorResourceSupport} from './handlers';
import {ResourceReplacementHistory} from './history';
import type {CodeMirrorResourceReplacementOptions} from './options';
import {prepareMarkupResources} from './resources';

type Anchor = {
    id: string;
    from: number;
    to: number;
    labelTo?: number;
    resourceFrom: number;
    resourceTo: number;
};
const resolved = Annotation.define<boolean>();
const trackedResources = Annotation.define<{
    targets: ResourceTarget[];
    source?: ResourceReplacementSource;
}>();

function mapAnchor(anchor: Anchor, changes: ChangeDesc): Anchor | undefined {
    let touched = false;
    changes.iterChangedRanges((from, to) => {
        if (
            (from < anchor.to && to > anchor.from) ||
            (from === to && from > anchor.from && from < anchor.to)
        ) {
            // A reference image owns its syntax, but editing its visible label is allowed.
            const labelEdit =
                anchor.labelTo !== undefined && from >= anchor.from + 2 && to <= anchor.labelTo - 1;
            if (!labelEdit) touched = true;
        }
    });
    if (touched) return undefined;
    return {
        ...anchor,
        from: changes.mapPos(anchor.from, 1),
        to: changes.mapPos(anchor.to, -1),
        resourceFrom: changes.mapPos(anchor.resourceFrom, 1),
        resourceTo: changes.mapPos(anchor.resourceTo, -1),
        ...(anchor.labelTo === undefined ? {} : {labelTo: changes.mapPos(anchor.labelTo, -1)}),
    };
}

const addAnchors = StateEffect.define<Anchor[]>({
    map: (anchors, changes) => anchors.flatMap((anchor) => mapAnchor(anchor, changes) ?? []),
});
const removeAnchors = StateEffect.define<string[]>();
const anchorsField = StateField.define<Anchor[]>({
    create: () => [],
    update: (anchors, tr) => {
        let result = anchors.flatMap((anchor) => mapAnchor(anchor, tr.changes) ?? []);
        for (const effect of tr.effects) {
            if (effect.is(removeAnchors))
                result = result.filter((anchor) => !effect.value.includes(anchor.id));
            if (effect.is(addAnchors)) {
                const ids = new Set(effect.value.map((anchor) => anchor.id));
                result = result.filter((anchor) => !ids.has(anchor.id)).concat(effect.value);
            }
        }
        return result;
    },
});

/** Independent CodeMirror extension; each editor supplies its own host and policy. */
export function codeMirrorResourceReplacement(options: CodeMirrorResourceReplacementOptions) {
    const history = new ResourceReplacementHistory();
    const runtime = ViewPlugin.define(
        (view) => new ResourceReplacementView(view, options, history),
    );
    return [
        Prec.lowest([
            extendedMarkdownLanguage(),
            codeMirrorResourceSupport(imageResourceHandler),
            codeMirrorResourceSupport(fileResourceHandler),
        ]),
        anchorsField,
        history.compartment.of([]),
        invertedEffects.of((tr) => {
            const before = tr.startState.field(anchorsField, false);
            const after = tr.state.field(anchorsField, false);
            if (!before || !after) return [];
            const remove = after.filter((a) => !before.some((b) => a.id === b.id)).map((a) => a.id);
            const restore = before.filter(
                (a) => !after.some((b) => a.id === b.id) || !mapAnchor(a, tr.changes),
            );
            return [
                ...(remove.length ? [removeAnchors.of(remove)] : []),
                ...(restore.length ? [addAnchors.of(restore)] : []),
            ];
        }),
        EditorState.transactionExtender.of((tr) => trackResources(tr, options)),
        runtime,
        // Update listeners run after the view update, when dispatch is permitted.
        EditorView.updateListener.of((update) => {
            update.view.plugin(runtime)?.process(update.transactions);
        }),
    ];
}

function trackResources(tr: Transaction, options: CodeMirrorResourceReplacementOptions) {
    const {host, shouldTrack, getSource} = options;
    if (!tr.docChanged) return null;
    let prepared: ReturnType<typeof prepareMarkupResources> | undefined;
    const prepare = () => {
        prepared ??= prepareMarkupResources(tr.startState, options, tr);
        return prepared;
    };
    const detachedTargets = tr.annotation(resolved)
        ? []
        : tr.startState.field(anchorsField).flatMap((anchor) => {
              const mapped = mapAnchor(anchor, tr.changes);
              if (!mapped) return [];
              const target = host.getTarget(anchor.id);
              if (!target) return [];
              const document = prepare();
              if (anchor.labelTo !== undefined) {
                  const reference = document.references.find(
                      (item) => item.from === mapped.from && item.to === mapped.to,
                  );
                  return reference?.resource.path === target.resource.path ? [] : [anchor.id];
              }
              const span = document.spans.find(
                  (item) => item.from === mapped.from && item.to === mapped.to,
              );
              const keys = [resourceKey(target.resource)];
              if (target.replacement !== undefined)
                  keys.push(
                      resourceKey({
                          ...target.resource,
                          path: encodeResourceUrl(options.urls(), target.replacement),
                      }),
                  );
              return span && keys.includes(span.key) ? [] : [anchor.id];
          });
    const removal = detachedTargets.length ? {effects: [removeAnchors.of(detachedTargets)]} : null;
    if (
        !tr.docChanged ||
        tr.annotation(resolved) ||
        tr.annotation(Transaction.remote) ||
        tr.isUserEvent('undo') ||
        tr.isUserEvent('redo')
    )
        return removal;
    if (!shouldTrack(tr)) {
        // A native move deletes and reinserts text. Preserve pending bindings even
        // when same-origin policy skips creating a new replacement operation.
        const moved = movedResourceAnchors(tr, host, prepare);
        return moved.length
            ? {effects: [...(removal?.effects ?? []), addAnchors.of(moved)]}
            : removal;
    }
    const targets: ResourceTarget[] = [];
    const anchors: Anchor[] = [];
    const document = prepare();
    tr.changes.iterChanges((_from, _to, from, to) => {
        for (const reference of document.references) {
            if (reference.from < from || reference.to > to) continue;
            const target = {id: uuid(), resource: reference.resource};
            targets.push(target);
            anchors.push({
                id: target.id,
                from: reference.from,
                to: reference.to,
                labelTo: reference.labelTo,
                resourceFrom: reference.from,
                resourceTo: reference.to,
            });
        }
        for (const span of document.spans) {
            if (span.from < from || span.to > to || from === to) continue;
            const resource = document.resources.find((item) => resourceKey(item) === span.key)!;
            const target = {id: uuid(), resource};
            targets.push(target);
            anchors.push({
                id: target.id,
                from: span.from,
                to: span.to,
                resourceFrom: span.range.from,
                resourceTo: span.range.to,
            });
        }
    });
    if (!targets.length) return removal;
    return {
        effects: [removeAnchors.of(detachedTargets), addAnchors.of(anchors)],
        annotations: [
            trackedResources.of({targets, source: getSource?.(tr)}),
            isolateHistory.of('full'),
        ],
    };
}

function movedResourceAnchors(
    tr: Transaction,
    host: CodeMirrorResourceReplacementOptions['host'],
    prepare: () => ReturnType<typeof prepareMarkupResources>,
): Anchor[] {
    if (!tr.isUserEvent('move.drop')) return [];
    const changes: Array<{from: number; to: number; newFrom: number; newTo: number}> = [];
    tr.changes.iterChanges((from, to, newFrom, newTo) => {
        changes.push({from, to, newFrom, newTo});
    });
    if (changes.length !== 2) return [];
    const deletion = changes.find(
        (change) => change.from < change.to && change.newFrom === change.newTo,
    );
    const insertion = changes.find(
        (change) => change.from === change.to && change.newFrom < change.newTo,
    );
    if (
        !deletion ||
        !insertion ||
        tr.startState.doc.sliceString(deletion.from, deletion.to) !==
            tr.newDoc.sliceString(insertion.newFrom, insertion.newTo)
    )
        return [];
    const offset = insertion.newFrom - deletion.from;
    return tr.startState.field(anchorsField).flatMap((anchor) => {
        if (anchor.from < deletion.from || anchor.to > deletion.to) return [];
        const target = host.getTarget(anchor.id);
        if (!target) return [];
        const keys = new Set([resourceKey(target.resource)]);
        if (target.replacement !== undefined)
            keys.add(resourceKey({...target.resource, path: target.replacement}));
        const moved = {
            ...anchor,
            from: anchor.from + offset,
            to: anchor.to + offset,
            ...(anchor.resourceFrom === undefined
                ? {}
                : {resourceFrom: anchor.resourceFrom + offset}),
            ...(anchor.resourceTo === undefined ? {} : {resourceTo: anchor.resourceTo + offset}),
            ...(anchor.labelTo === undefined ? {} : {labelTo: anchor.labelTo + offset}),
        };
        const document = prepare();
        const matches =
            anchor.labelTo === undefined
                ? document.spans.some(
                      (span) =>
                          span.from === moved.from && span.to === moved.to && keys.has(span.key),
                  )
                : document.references.some(
                      (reference) =>
                          reference.from === moved.from &&
                          reference.to === moved.to &&
                          keys.has(resourceKey(reference.resource)),
                  );
        return matches ? [moved] : [];
    });
}

class ResourceReplacementView {
    private applying = false;
    private destroyed = false;
    private readonly seen = new WeakSet<Transaction>();
    private readonly unregister: () => void;
    private readonly view: EditorView;
    private readonly options: CodeMirrorResourceReplacementOptions;
    private readonly history: ResourceReplacementHistory;

    constructor(
        view: EditorView,
        options: CodeMirrorResourceReplacementOptions,
        history: ResourceReplacementHistory,
    ) {
        this.view = view;
        this.options = options;
        this.history = history;
        this.unregister = options.host.register({
            snapshot: () => this.snapshot(view),
            restore: (snapshot) => this.restore(view, snapshot),
            flush: () => this.flush(view),
            retainedTargets: () => {
                const ids = history.retainedTargets(view.state, (effect) => {
                    if (effect.is(addAnchors)) return effect.value.map((anchor) => anchor.id);
                    if (effect.is(removeAnchors)) return effect.value;
                    return [];
                });
                const anchors = view.state.field(anchorsField, false);
                if (!ids || !anchors) return undefined;
                return new Set([...ids, ...anchors.map((anchor) => anchor.id)]);
            },
            forgetTargets: (ids) => {
                const removed = view.state
                    .field(anchorsField)
                    .filter((anchor) => ids.has(anchor.id))
                    .map((anchor) => anchor.id);
                if (removed.length)
                    view.dispatch({
                        effects: removeAnchors.of(removed),
                        annotations: Transaction.addToHistory.of(false),
                    });
            },
        });
    }

    process(transactions: readonly Transaction[]) {
        this.options.host.collectGarbage?.();
        for (const tr of transactions) {
            if (this.seen.has(tr)) continue;
            this.seen.add(tr);
            const tracked = tr.annotation(trackedResources);
            if (tracked?.targets.length)
                this.options.host.resolve(
                    tracked.targets,
                    (path) => validateResourceUrl(this.options.urls(), path),
                    tracked.source,
                );
        }
        if (!this.applying && transactions.some((tr) => tr.docChanged)) this.flush(this.view);
    }

    destroy() {
        this.destroyed = true;
        this.unregister();
    }

    private snapshot(view: EditorView): ResourceOccurrence[] {
        const prepared = prepareMarkupResources(view.state, this.options);
        const result = prepared.occurrences;
        for (const anchor of view.state.field(anchorsField)) {
            if (anchor.labelTo !== undefined) {
                const reference = prepared.references.find(
                    (item) => item.from === anchor.from && item.to === anchor.to,
                );
                const target = this.options.host.getTarget(anchor.id);
                if (reference && target && reference.resource.path === target.resource.path)
                    result[reference.occurrence].targetId = anchor.id;
                continue;
            }
            const span = prepared.spans.find(
                (item) => item.from === anchor.from && item.to === anchor.to,
            );
            const target = this.options.host.getTarget(anchor.id);
            if (!span || !target) continue;
            for (const index of span.occurrences) {
                if (
                    result[index].path === target.resource.path ||
                    result[index].path ===
                        (target.replacement &&
                            encodeResourceUrl(this.options.urls(), target.replacement))
                )
                    result[index].targetId = anchor.id;
            }
        }
        return result;
    }

    private restore(view: EditorView, snapshot: ResourceOccurrence[]) {
        const prepared = prepareMarkupResources(view.state, this.options);
        if (
            prepared.occurrences.length !== snapshot.length ||
            prepared.occurrences.some(
                (item, index) =>
                    item.kind !== snapshot[index].kind || item.path !== snapshot[index].path,
            )
        )
            return;
        const anchors: Anchor[] = [];
        for (const reference of prepared.references) {
            const id = snapshot[reference.occurrence]?.targetId;
            if (id)
                anchors.push({
                    id,
                    from: reference.from,
                    to: reference.to,
                    labelTo: reference.labelTo,
                    resourceFrom: reference.from,
                    resourceTo: reference.to,
                });
        }
        for (const span of prepared.spans) {
            if (
                span.occurrences.some((index) =>
                    prepared.references.some((reference) => reference.occurrence === index),
                )
            )
                continue;
            const id = snapshot[span.occurrences[0]]?.targetId;
            if (id && span.occurrences.every((index) => snapshot[index].targetId === id))
                anchors.push({
                    id,
                    from: span.from,
                    to: span.to,
                    resourceFrom: span.range.from,
                    resourceTo: span.range.to,
                });
        }
        view.dispatch({
            effects: [
                ...this.history.tagLast(view.state, removeAnchors.of(anchors.map((a) => a.id))),
                removeAnchors.of(view.state.field(anchorsField).map((a) => a.id)),
                addAnchors.of(anchors),
            ],
            annotations: Transaction.addToHistory.of(false),
        });
    }

    private flush(view: EditorView) {
        if (this.destroyed || this.applying || !this.options.host.active) return;
        const urls = this.options.urls();
        const candidates = view.state.field(anchorsField).filter((anchor) => {
            const target = this.options.host.getTarget(anchor.id);
            return (
                target?.replacement !== undefined &&
                view.state.sliceDoc(anchor.from, anchor.to) !==
                    encodeResourceUrl(urls, target.replacement)
            );
        });
        if (!candidates.length) return;
        const prepared = prepareMarkupResources(view.state, this.options);
        const changes: Array<
            ChangeSpec & {
                from: number;
                to: number;
                insert: string;
                id: string;
                pathOffset?: number;
                pathLength?: number;
                resourceFrom: number;
                resourceTo: number;
            }
        > = [];
        for (const anchor of candidates) {
            const target = this.options.host.getTarget(anchor.id);
            if (!target || target.replacement === undefined) continue;
            if (anchor.labelTo !== undefined) {
                const reference = prepared.references.find(
                    (item) => item.from === anchor.from && item.to === anchor.to,
                );
                if (
                    !reference ||
                    reference.resource.path !== target.resource.path ||
                    reference.resource.path === encodeResourceUrl(urls, target.replacement)
                )
                    continue;
                changes.push({
                    id: anchor.id,
                    // Preserve the label's source range so its history remains independent.
                    from: reference.labelTo,
                    to: anchor.to,
                    insert: reference
                        .replace(target.replacement)
                        .slice(reference.labelTo - reference.from),
                    resourceFrom: reference.from,
                    resourceTo: reference.to,
                    pathOffset: 1,
                    pathLength: encodeResourceUrl(urls, target.replacement).length,
                });
                continue;
            }
            const span = prepared.spans.find(
                (item) => item.from === anchor.from && item.to === anchor.to,
            );
            const resource =
                span && prepared.resources.find((item) => resourceKey(item) === span.key);
            if (
                !resource ||
                resource.kind !== target.resource.kind ||
                resource.path !== target.resource.path
            )
                continue;
            if (!urls.validateLink(target.replacement)) throw new Error('Invalid resource URL');
            const insert = encodeResourceUrl(urls, target.replacement);
            if (view.state.sliceDoc(anchor.from, anchor.to) === insert) continue;
            changes.push({
                ...anchor,
                insert,
                resourceFrom: span!.range.from,
                resourceTo: span!.range.to,
            });
        }
        if (!changes.length) return;
        if (view.state.readOnly || !view.state.facet(EditorView.editable))
            throw new Error('Editor is no longer editable');
        changes.sort((a, b) => a.from - b.from);
        const set = view.state.changes(changes);
        const anchors = changes.map((change) => ({
            id: change.id,
            resourceFrom: set.mapPos(change.resourceFrom, -1),
            resourceTo: set.mapPos(change.resourceTo, 1),
            from: set.mapPos(change.from, -1) + (change.pathOffset ?? 0),
            to:
                set.mapPos(change.from, -1) +
                (change.pathOffset ?? 0) +
                (change.pathLength ?? change.insert.length),
        }));
        let transaction = view.state.update({
            changes: set,
            effects: addAnchors.of(anchors),
            annotations: [Transaction.addToHistory.of(false), resolved.of(true)],
        });
        if (!transaction.docChanged) throw new Error('Resource replacement was rejected');
        const ids = new Set(changes.map((change) => change.id));
        const effects = this.history.amend(transaction, (effects) =>
            effects.some(
                (effect) => effect.is(removeAnchors) && effect.value.some((id) => ids.has(id)),
            ),
        );
        if (effects.length) transaction = view.state.update(transaction, {effects, filter: false});
        this.applying = true;
        try {
            view.dispatch(transaction);
            if (!view.state.doc.eq(transaction.newDoc))
                throw new Error('Resource replacement was rejected');
        } finally {
            this.applying = false;
        }
    }
}
