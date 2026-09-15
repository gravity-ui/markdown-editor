import {invertedEffects, isolateHistory} from '@codemirror/commands';
import {syntaxTree} from '@codemirror/language';
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
import {EditorView} from '@codemirror/view';

import type {Parser} from '../core/types/parser';

import {PasteCodeMirrorHistory} from './codemirror-history';
import type {PasteController} from './controller';
import {pasteHistoryBoundary} from './history';
import {
    ResourceCollection,
    encodeResourceUrl,
    prepareMarkupResources,
    validateResourceUrl,
} from './resources';
import {resourceKey} from './tracking';
import type {ResourceOccurrence, ResourceTarget} from './tracking';

type Anchor = {id: string; from: number; to: number; labelTo?: number};
const resolved = Annotation.define<boolean>();
const pasted = Annotation.define<ResourceTarget[]>();

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

export class CodeMirrorPaste {
    readonly controller: PasteController;
    private readonly parser: () => Parser;
    private event?: {plain: boolean};
    private shift = false;
    private applying = false;
    private destroyed = false;
    private history = new PasteCodeMirrorHistory();

    constructor(controller: PasteController, parser: () => Parser) {
        this.controller = controller;
        this.parser = parser;
    }

    extension() {
        return [
            anchorsField,
            this.history.compartment.of([]),
            invertedEffects.of((tr) => {
                const before = tr.startState.field(anchorsField);
                const after = tr.state.field(anchorsField);
                // Effects use positions in the document produced by the inverse transaction.
                const remove = after
                    .filter((a) => !before.some((b) => a.id === b.id))
                    .map((a) => a.id);
                const restore = before.filter((a) => !after.some((b) => a.id === b.id));
                return [
                    ...(remove.length ? [removeAnchors.of(remove)] : []),
                    ...(restore.length ? [addAnchors.of(restore)] : []),
                ];
            }),
            EditorState.transactionExtender.of((tr) => {
                const event = this.event;
                if (!tr.docChanged) return null;
                this.event = undefined;
                let prepared: ReturnType<typeof prepareMarkupResources> | undefined;
                const prepare = () => {
                    prepared ??= prepareMarkupResources(tr.newDoc.toString(), this.parser());
                    return prepared;
                };
                const removedReferences =
                    !this.controller.enabled || tr.annotation(resolved)
                        ? []
                        : tr.startState.field(anchorsField).flatMap((anchor) => {
                              if (anchor.labelTo === undefined) return [];
                              const mapped = mapAnchor(anchor, tr.changes);
                              if (!mapped) return [];
                              const reference = prepare().references.find(
                                  (item) => item.from === mapped.from && item.to === mapped.to,
                              );
                              return reference?.resource.path ===
                                  this.controller.getTarget(anchor.id)?.resource.path
                                  ? []
                                  : [anchor.id];
                          });
                const removal = removedReferences.length
                    ? {effects: removeAnchors.of(removedReferences)}
                    : null;
                if (
                    !this.controller.enabled ||
                    !tr.docChanged ||
                    tr.annotation(resolved) ||
                    tr.annotation(Transaction.remote) ||
                    !(event || tr.isUserEvent('input.paste')) ||
                    event?.plain
                )
                    return removal;
                const collection = new ResourceCollection();
                const targets: ResourceTarget[] = [];
                const anchors: Anchor[] = [];
                const document = prepare();
                tr.changes.iterChanges((_from, _to, from, to, text) => {
                    for (const reference of document.references) {
                        if (reference.from < from || reference.to > to) continue;
                        const {resource} = reference;
                        const collected = collection.add(
                            resource.kind,
                            resource.path,
                            resource.name,
                        );
                        const target = this.controller.createTarget(collected);
                        targets.push(target);
                        anchors.push({
                            id: target.id,
                            from: reference.from,
                            to: reference.to,
                            labelTo: reference.labelTo,
                        });
                    }
                    const fragment = prepareMarkupResources(text.toString(), this.parser());
                    for (const resource of fragment.resources) {
                        const collected = collection.add(
                            resource.kind,
                            resource.path,
                            resource.name,
                        );
                        const spans = fragment.spans.filter(
                            (span) =>
                                span.key === resourceKey(resource) &&
                                !span.occurrences.some((index) =>
                                    fragment.references.some(
                                        (reference) => reference.occurrence === index,
                                    ),
                                ),
                        );
                        // Even an unsupported source span is reported to the application;
                        // its result must not rewrite unrelated references in the document.
                        if (
                            !spans.length &&
                            !fragment.references.some(
                                (reference) =>
                                    resourceKey(reference.resource) === resourceKey(resource),
                            )
                        )
                            targets.push(this.controller.createTarget(collected));
                        for (const span of spans) {
                            const target = this.controller.createTarget(collected);
                            targets.push(target);
                            const actual = document.spans.find(
                                (item) =>
                                    item.from === from + span.from && item.to === from + span.to,
                            );
                            if (actual && actual.occurrences.length === span.occurrences.length) {
                                anchors.push({id: target.id, from: actual.from, to: actual.to});
                            }
                        }
                    }
                });
                if (!targets.length) return removal;
                return {
                    effects: [removeAnchors.of(removedReferences), addAnchors.of(anchors)],
                    annotations: [pasted.of(targets), isolateHistory.of('full')],
                };
            }),
            Prec.highest(
                EditorView.domEventHandlers({
                    keydown: (event) => {
                        this.shift = event.shiftKey;
                        return false;
                    },
                    keyup: (event) => {
                        this.shift = event.shiftKey;
                        return false;
                    },
                    paste: (_event, view) => {
                        let code = false;
                        for (
                            let node = syntaxTree(view.state).resolveInner(
                                view.state.selection.main.from,
                                -1,
                            );
                            node;
                            node = node.parent!
                        ) {
                            if (['FencedCode', 'CodeBlock', 'InlineCode'].includes(node.name))
                                code = true;
                        }
                        const context = (this.event = {plain: this.shift || code});
                        queueMicrotask(() => {
                            if (this.event === context) this.event = undefined;
                        });
                        return false;
                    },
                }),
            ),
        ];
    }

    attach(view: EditorView) {
        const unregister = this.controller.register('markup', {
            snapshot: () => this.snapshot(view),
            restore: (snapshot) => this.restore(view, snapshot),
            flush: () => this.flush(view),
        });
        return () => {
            this.destroyed = true;
            unregister();
        };
    }

    dispatch(
        view: EditorView,
        transactions: readonly Transaction[],
        apply: (transactions: readonly Transaction[]) => void,
    ) {
        const targets = transactions.flatMap((tr) => tr.annotation(pasted) ?? []);
        const boundaries = view.state.facet(pasteHistoryBoundary);
        if (targets.length) {
            this.controller.activate('markup');
            for (const boundary of boundaries) boundary();
        }
        apply(transactions);
        if (targets.length) {
            for (const boundary of boundaries) boundary();
            const resources = [
                ...new Map(
                    targets.map((target) => [resourceKey(target.resource), target.resource]),
                ).values(),
            ];
            this.controller.resolveTargets(resources, targets, (path) =>
                validateResourceUrl(this.parser(), path),
            );
        }
        if (!this.applying && transactions.some((tr) => tr.docChanged)) this.flush(view);
    }

    private snapshot(view: EditorView): ResourceOccurrence[] {
        const prepared = prepareMarkupResources(view.state.doc.toString(), this.parser());
        const result = prepared.occurrences;
        for (const anchor of view.state.field(anchorsField)) {
            if (anchor.labelTo !== undefined) {
                const reference = prepared.references.find(
                    (item) => item.from === anchor.from && item.to === anchor.to,
                );
                const target = this.controller.getTarget(anchor.id);
                if (reference && target && reference.resource.path === target.resource.path)
                    result[reference.occurrence].targetId = anchor.id;
                continue;
            }
            const span = prepared.spans.find(
                (item) => item.from === anchor.from && item.to === anchor.to,
            );
            const target = this.controller.getTarget(anchor.id);
            if (!span || !target) continue;
            for (const index of span.occurrences) {
                if (
                    result[index].path === target.resource.path ||
                    result[index].path ===
                        (target.replacement && encodeResourceUrl(this.parser(), target.replacement))
                )
                    result[index].targetId = anchor.id;
            }
        }
        return result;
    }

    private restore(view: EditorView, snapshot: ResourceOccurrence[]) {
        const prepared = prepareMarkupResources(view.state.doc.toString(), this.parser());
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
                anchors.push({id, from: span.from, to: span.to});
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
        if (
            this.destroyed ||
            this.applying ||
            !this.controller.enabled ||
            !this.controller.isActive('markup')
        )
            return;
        const parser = this.parser();
        const candidates = view.state.field(anchorsField).filter((anchor) => {
            const target = this.controller.getTarget(anchor.id);
            return (
                target?.replacement !== undefined &&
                view.state.sliceDoc(anchor.from, anchor.to) !==
                    encodeResourceUrl(parser, target.replacement)
            );
        });
        if (!candidates.length) return;
        const prepared = prepareMarkupResources(view.state.doc.toString(), parser);
        const changes: Array<
            ChangeSpec & {
                from: number;
                to: number;
                insert: string;
                id: string;
                pathOffset?: number;
                pathLength?: number;
            }
        > = [];
        for (const anchor of candidates) {
            const target = this.controller.getTarget(anchor.id);
            if (!target || target.replacement === undefined) continue;
            if (anchor.labelTo !== undefined) {
                const reference = prepared.references.find(
                    (item) => item.from === anchor.from && item.to === anchor.to,
                );
                if (
                    !reference ||
                    reference.resource.path !== target.resource.path ||
                    reference.resource.path === encodeResourceUrl(parser, target.replacement)
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
                    pathOffset: 1,
                    pathLength: encodeResourceUrl(parser, target.replacement).length,
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
            if (!parser.validateLink(target.replacement)) throw new Error('Invalid resource URL');
            const insert = encodeResourceUrl(parser, target.replacement);
            if (view.state.sliceDoc(anchor.from, anchor.to) === insert) continue;
            changes.push({...anchor, insert});
        }
        if (!changes.length) return;
        if (view.state.readOnly || !view.state.facet(EditorView.editable))
            throw new Error('Editor is no longer editable');
        changes.sort((a, b) => a.from - b.from);
        const set = view.state.changes(changes);
        const anchors = changes.map((change) => ({
            id: change.id,
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
