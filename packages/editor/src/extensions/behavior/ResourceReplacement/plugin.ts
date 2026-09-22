import {closeHistory} from 'prosemirror-history';
import {type EditorState, Plugin, type Transaction} from 'prosemirror-state';
import {v4 as uuid} from 'uuid';

import {
    collectAddedRangesInFinalDocument,
    collectRequestedUrlKeys,
    collectResourcesInRanges,
} from './collect-resources';
import {createResourceDecorations} from './decorations';
import {changesProtectedResources} from './editing-guard';
import {getResourceReplacementMeta, resolvedResourceMeta, setResourceReplacementMeta} from './meta';
import {resourceReplacementKey} from './plugin-key';
import {prepareResourceReplacementTransaction} from './prepare-replacements';
import type {ResourceBatch, ResourceReplacementOptions, ResourceReplacementState} from './types';
import {
    applyBatchMeta,
    isHistoryTransaction,
    isOriginalLocalDocumentChange,
    isSelectionInCode,
    mapBatchRanges,
} from './utils';

/** Requests start in view.update, only after the editor accepts the insertion. */
export function resourceReplacementPlugin({controller, shouldTrack}: ResourceReplacementOptions) {
    function shouldTrackResources(tr: Transaction, state: EditorState) {
        return (
            controller.enabled &&
            isOriginalLocalDocumentChange(tr) &&
            (tr.getMeta('uiEvent') === 'drop' || !isSelectionInCode(state)) &&
            shouldTrack(tr, state)
        );
    }

    return new Plugin<ResourceReplacementState>({
        key: resourceReplacementKey,
        filterTransaction(tr, state) {
            if (tr.getMeta(resolvedResourceMeta)) return true;

            const batches = resourceReplacementKey.getState(state) ?? [];
            if ((controller.busy || batches.length) && isHistoryTransaction(tr)) return false;
            if (!tr.docChanged) return true;
            if (changesProtectedResources(tr, state, batches)) return false;

            if (shouldTrackResources(tr, state)) closeHistory(tr);
            return true;
        },
        state: {
            init: () => [],
            apply(tr, batches, oldState, state) {
                const meta = getResourceReplacementMeta(tr);
                if (!tr.docChanged && !meta) return batches;

                const mappedBatches = mapBatchRanges(batches, tr.mapping);
                const result = applyBatchMeta(mappedBatches, meta);
                if (shouldTrackResources(tr, oldState)) {
                    const addedRanges = collectAddedRangesInFinalDocument(tr);
                    const ranges = collectResourcesInRanges(state, addedRanges).map(
                        ({from, to}) => ({from, to}),
                    );
                    if (ranges.length) result.push({id: uuid(), ranges, started: false});
                }
                return result;
            },
        },
        props: {
            decorations(state) {
                const batches = resourceReplacementKey.getState(state) ?? [];
                return createResourceDecorations(state, batches);
            },
        },
        view(view) {
            const lifetime = {destroyed: false};

            function releaseBatch(id: string) {
                if (!lifetime.destroyed && !view.isDestroyed)
                    view.dispatch(
                        setResourceReplacementMeta(view.state.tr, {type: 'release', id}).setMeta(
                            'addToHistory',
                            false,
                        ),
                    );
            }

            function applyReplacements(
                replacements: ReadonlyMap<string, string>,
                urlKeys: ReadonlySet<string>,
            ) {
                if (lifetime.destroyed || view.isDestroyed) throw new Error('Editor was destroyed');
                const tr = prepareResourceReplacementTransaction(view.state, replacements, urlKeys);
                if (!tr) return;
                if (!view.editable) throw new Error('Editor is no longer editable');
                view.dispatch(tr);
                if (!view.state.doc.eq(tr.doc))
                    throw new Error('Resource replacement was rejected');
            }

            function startBatch(batch: ResourceBatch) {
                const entries = collectResourcesInRanges(view.state, batch.ranges);
                const resources = entries.map((item) => item.resource);
                const urlKeys = collectRequestedUrlKeys(view.state, entries);
                // Mark the batch before starting a request that may dispatch synchronously.
                view.dispatch(
                    setResourceReplacementMeta(closeHistory(view.state.tr), {
                        type: 'start',
                        id: batch.id,
                    }),
                );
                const release = () => releaseBatch(batch.id);
                const started = controller.start({
                    resources,
                    release,
                    apply: (replacements) => applyReplacements(replacements, urlKeys),
                });
                if (!started) release();
            }

            return {
                update() {
                    for (const batch of resourceReplacementKey.getState(view.state) ?? []) {
                        if (batch.started) continue;
                        startBatch(batch);
                    }
                },
                destroy() {
                    lifetime.destroyed = true;
                },
            };
        },
    });
}
