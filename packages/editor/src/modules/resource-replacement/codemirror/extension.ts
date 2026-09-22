import {invertedEffects, isolateHistory} from '@codemirror/commands';
import {
    Annotation,
    type ChangeDesc,
    EditorState,
    Prec,
    StateEffect,
    StateField,
    Transaction,
    type TransactionSpec,
} from '@codemirror/state';
import {Decoration, type DecorationSet, EditorView, ViewPlugin, WidgetType} from '@codemirror/view';
import {v4 as uuid} from 'uuid';

import {historyLocked} from '../../../markup/codemirror/history-lock';
import {extendedMarkdownLanguage} from '../../../markup/codemirror/markdown-syntax';
import {ReactRendererFacet} from '../../../markup/codemirror/react-facet';
import {type ResourceRange, overlaps, resourceKey} from '../controller.utils';
import {createResourceIndicator, destroyResourceIndicator} from '../indicator';
import type {ReplacementResource} from '../types';

import {fileResourceHandler, imageResourceHandler} from './builtins';
import {codeMirrorResourceSupport} from './handlers';
import {ResourceReplacementHistory, pasteEvent} from './history';
import type {CodeMirrorResourceReplacementOptions} from './options';
import {collectInsertedMarkupResources, markupResourceChanges} from './resources';

type PendingRange = ResourceRange & {resource: ReplacementResource; isUrl: boolean};
type Batch = {id: string; ranges: PendingRange[]};
const resolved = Annotation.define<boolean>();
const tracked = Annotation.define<Batch>();
const release = StateEffect.define<string>();
function mapRange<T extends ResourceRange>(range: T, changes: ChangeDesc): T {
    return {...range, from: changes.mapPos(range.from, -1), to: changes.mapPos(range.to, 1)};
}
const pendingField = StateField.define<Batch[]>({
    create: () => [],
    provide: (field) => historyLocked.from(field, (batches) => batches.length > 0),
    update(batches, tr) {
        const trackedBatch = tr.annotation(tracked);
        if (
            !trackedBatch &&
            (!batches.length ||
                (!tr.docChanged && !tr.effects.some((effect) => effect.is(release))))
        )
            return batches;
        const result = batches
            .filter(
                (batch) =>
                    !tr.effects.some((effect) => effect.is(release) && effect.value === batch.id),
            )
            .map((batch) => ({
                ...batch,
                ranges: batch.ranges.map((range) => {
                    // Outside edits at the boundary are not part of the protected resource.
                    if (!tr.annotation(resolved))
                        return {
                            ...range,
                            from: tr.changes.mapPos(range.from, 1),
                            to: tr.changes.mapPos(range.to, -1),
                        };
                    return mapRange(range, tr.changes);
                }),
            }));
        if (trackedBatch) result.push(trackedBatch);
        return result;
    },
});

class PendingWidget extends WidgetType {
    readonly id: string;
    readonly resource: ReplacementResource;
    constructor(id: string, resource: ReplacementResource) {
        super();
        this.id = id;
        this.resource = resource;
    }
    eq(other: PendingWidget) {
        return this.id === other.id && this.resource === other.resource;
    }
    toDOM(view: EditorView) {
        return createResourceIndicator(this.resource, view.state.facet(ReactRendererFacet));
    }
    destroy(dom: HTMLElement) {
        destroyResourceIndicator(dom);
    }
}

export function codeMirrorResourceReplacement(options: CodeMirrorResourceReplacementOptions) {
    if (!Object.values(options.resources).some(Boolean)) return [];
    const history = new ResourceReplacementHistory();
    const seen = new WeakSet<Transaction>();
    // Native CM history commands explicitly bypass transaction filters. Guard their
    // dispatch as well, including commands supplied by consumer keymaps.
    const lifetime = ViewPlugin.define((view) => {
        const dispatch = view.dispatch;
        const guarded: typeof dispatch = (
            ...input: [Transaction] | [readonly Transaction[]] | TransactionSpec[]
        ) => {
            const transactions =
                input[0] instanceof Transaction
                    ? [input[0]]
                    : Array.isArray(input[0])
                      ? input[0]
                      : [];
            if (
                view.state.facet(historyLocked) &&
                transactions.some((tr) => tr.isUserEvent('undo') || tr.isUserEvent('redo'))
            )
                return;
            if (input[0] instanceof Transaction) dispatch(input[0]);
            else if (Array.isArray(input[0])) dispatch(input[0]);
            else dispatch(...(input as TransactionSpec[]));
        };
        view.dispatch = guarded;
        return {
            destroyed: false,
            destroy() {
                this.destroyed = true;
                if (view.dispatch === guarded) view.dispatch = dispatch;
            },
        };
    });
    const decorations = (state: EditorState) =>
        Decoration.set(
            state.field(pendingField).flatMap((batch) =>
                batch.ranges.map((range, index) =>
                    Decoration.replace({
                        widget: new PendingWidget(`${batch.id}:${index}`, range.resource),
                    }).range(range.from, range.to),
                ),
            ),
            true,
        );
    const decorationField = StateField.define<DecorationSet>({
        create: decorations,
        update(value, tr) {
            return tr.state.field(pendingField) === tr.startState.field(pendingField)
                ? value
                : decorations(tr.state);
        },
        provide: (field) => EditorView.decorations.from(field),
    });
    return [
        Prec.lowest([
            extendedMarkdownLanguage(),
            codeMirrorResourceSupport(imageResourceHandler),
            codeMirrorResourceSupport(fileResourceHandler),
        ]),
        pendingField,
        lifetime,
        history.compartment.of([]),
        decorationField,
        EditorView.atomicRanges.of((view) => view.state.field(decorationField)),
        invertedEffects.of((tr) => {
            const batch = tr.annotation(tracked);
            if (batch) return [pasteEvent.of(batch.ranges.map(({from, to}) => ({from, to})))];
            if (!tr.effects.some((effect) => effect.is(pasteEvent))) return [];
            // Carry the paste event through Undo/Redo without replaying the request.
            const ranges: ResourceRange[] = [];
            tr.changes.iterChanges((_from, _to, from, to) => {
                if (from < to) ranges.push({from, to});
            });
            return [pasteEvent.of(ranges)];
        }),
        Prec.highest(
            EditorState.transactionFilter.of((tr) => {
                if (tr.annotation(resolved)) return tr;
                const batches = tr.startState.field(pendingField);
                if (
                    (options.controller.busy || batches.length) &&
                    (tr.isUserEvent('undo') || tr.isUserEvent('redo'))
                )
                    return [];
                let blocked = false;
                tr.changes.iterChangedRanges((from, to) => {
                    if (
                        batches.some((batch) =>
                            batch.ranges.some((range) => overlaps(range, from, to)),
                        )
                    )
                        blocked = true;
                });
                return blocked ? [] : tr;
            }),
        ),
        EditorState.transactionExtender.of((tr) => {
            if (
                !options.controller.enabled ||
                !tr.docChanged ||
                tr.annotation(resolved) ||
                tr.annotation(Transaction.remote) ||
                tr.isUserEvent('undo') ||
                tr.isUserEvent('redo') ||
                !options.shouldTrack(tr)
            )
                return null;
            const ranges = collectInsertedMarkupResources(tr, options);
            if (!ranges.length) return null;
            return {annotations: [tracked.of({id: uuid(), ranges}), isolateHistory.of('full')]};
        }),
        EditorView.updateListener.of((update) => {
            for (const tr of update.transactions) {
                if (seen.has(tr)) continue;
                seen.add(tr);
                const batch = tr.annotation(tracked);
                if (!batch) continue;
                const view = update.view;
                const instance = view.plugin(lifetime)!;
                const finish = () => {
                    if (!instance.destroyed)
                        view.dispatch({
                            effects: release.of(batch.id),
                            annotations: Transaction.addToHistory.of(false),
                        });
                };
                const started = options.controller.start({
                    resources: batch.ranges.map((range) => range.resource),
                    release: finish,
                    apply(replacements) {
                        if (instance.destroyed) throw new Error('Editor was destroyed');
                        const edits = markupResourceChanges(
                            view.state,
                            replacements,
                            options,
                            new Set(
                                batch.ranges
                                    .filter((range) => range.isUrl)
                                    .map((range) => resourceKey(range.resource)),
                            ),
                        );
                        if (!edits.length) return;
                        if (view.state.readOnly || !view.state.facet(EditorView.editable))
                            throw new Error('Editor is no longer editable');
                        let transaction = view.state.update({
                            changes: edits,
                            annotations: [resolved.of(true), Transaction.addToHistory.of(false)],
                        });
                        if (!transaction.docChanged)
                            throw new Error('Resource replacement was rejected');
                        const effects = history.amend(transaction);
                        if (effects.length)
                            transaction = view.state.update(transaction, {effects, filter: false});
                        view.dispatch(transaction);
                        if (!view.state.doc.eq(transaction.newDoc))
                            throw new Error('Resource replacement was rejected');
                    },
                });
                if (!started) finish();
            }
        }),
    ];
}
