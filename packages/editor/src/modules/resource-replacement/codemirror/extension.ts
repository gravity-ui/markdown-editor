import {invertedEffects, isolateHistory} from '@codemirror/commands';
import {EditorState, Prec, Transaction} from '@codemirror/state';
import {EditorView, ViewPlugin} from '@codemirror/view';
import {v4 as uuid} from 'uuid';

import {historyLockGuard} from '../../../markup/codemirror/history-lock';
import {extendedMarkdownLanguage} from '../../../markup/codemirror/markdown-syntax';
import {type ResourceRange, resourceKey} from '../controller.utils';

import {fileResourceHandler, imageResourceHandler} from './builtins';
import {collectInsertedMarkupResources} from './collect-resources';
import {release, resolved, tracked} from './const';
import {createResourceDecorationExtension} from './decorations';
import {changesProtectedResources} from './editing-guard';
import {codeMirrorResourceSupport} from './handlers';
import {ResourceReplacementHistory, pasteEvent} from './history';
import type {CodeMirrorResourceReplacementOptions} from './options';
import {pendingField} from './pending-state';
import {prepareResourceChanges} from './prepare-replacements';
import {isHistoryTransaction, isOriginalLocalDocumentChange} from './transactions';

export function codeMirrorResourceReplacement(options: CodeMirrorResourceReplacementOptions) {
    if (!Object.values(options.resources).some(Boolean)) return [];
    const history = new ResourceReplacementHistory();
    const seen = new WeakSet<Transaction>();
    const lifetime = ViewPlugin.define(() => ({
        destroyed: false,
        destroy() {
            this.destroyed = true;
        },
    }));

    function shouldTrackResources(tr: Transaction) {
        return (
            options.controller.enabled &&
            isOriginalLocalDocumentChange(tr) &&
            options.shouldTrack(tr)
        );
    }

    function releaseBatch(view: EditorView, instance: {destroyed: boolean}, id: string) {
        if (!instance.destroyed)
            view.dispatch({
                effects: release.of(id),
                annotations: Transaction.addToHistory.of(false),
            });
    }

    function applyReplacements(
        view: EditorView,
        instance: {destroyed: boolean},
        replacements: ReadonlyMap<string, string>,
        urlKeys: ReadonlySet<string>,
    ) {
        if (instance.destroyed) throw new Error('Editor was destroyed');
        const edits = prepareResourceChanges(view.state, replacements, options, urlKeys);
        if (!edits.length) return;
        if (view.state.readOnly || !view.state.facet(EditorView.editable))
            throw new Error('Editor is no longer editable');
        let transaction = view.state.update({
            changes: edits,
            annotations: [resolved.of(true), Transaction.addToHistory.of(false)],
        });
        if (!transaction.docChanged) throw new Error('Resource replacement was rejected');
        const effects = history.amend(transaction);
        if (effects.length) transaction = view.state.update(transaction, {effects, filter: false});
        view.dispatch(transaction);
        if (!view.state.doc.eq(transaction.newDoc))
            throw new Error('Resource replacement was rejected');
    }

    return [
        Prec.lowest([
            extendedMarkdownLanguage(),
            codeMirrorResourceSupport(imageResourceHandler),
            codeMirrorResourceSupport(fileResourceHandler),
        ]),
        pendingField,
        lifetime,
        historyLockGuard(),
        history.compartment.of([]),
        createResourceDecorationExtension(),
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
                if ((options.controller.busy || batches.length) && isHistoryTransaction(tr))
                    return [];
                if (changesProtectedResources(tr, batches)) return [];
                return tr;
            }),
        ),
        EditorState.transactionExtender.of((tr) => {
            if (!shouldTrackResources(tr)) return null;
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
                const releasePendingBatch = () => releaseBatch(view, instance, batch.id);
                const started = options.controller.start({
                    resources: batch.ranges.map((range) => range.resource),
                    release: releasePendingBatch,
                    apply: (replacements) =>
                        applyReplacements(
                            view,
                            instance,
                            replacements,
                            new Set(
                                batch.ranges
                                    .filter((range) => range.isUrl)
                                    .map((range) => resourceKey(range.resource)),
                            ),
                        ),
                });
                if (!started) releasePendingBatch();
            }
        }),
    ];
}
