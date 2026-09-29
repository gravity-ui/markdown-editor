import {closeHistory} from 'prosemirror-history';
import {type EditorState, Plugin, type Transaction} from 'prosemirror-state';
import {v4 as uuid} from 'uuid';

import {collectRequestedUrlKeys} from '../../../modules/resource-replacement/read-node-resource';
import {validateResourceSchema} from '../../../modules/resource-replacement/schema';

import {collectAddedRangesInFinalDocument, collectResourcesInRanges} from './collect-resources';
import {
    getResourceReplacementMeta,
    isResourceReplacementCleanupTransaction,
    resolvedResourceMeta,
    setResourceReplacementMeta,
} from './meta';
import {resourceReplacementKey} from './plugin-key';
import {prepareResourceReplacementTransaction} from './prepare-replacements';
import type {ResourceBatch, ResourceReplacementOptions, ResourceReplacementState} from './types';
import {
    applyBatchMeta,
    isLocalHistoryTransaction,
    isOriginalLocalDocumentChange,
    isSelectionInCode,
    mapBatchRanges,
} from './utils';

export function resourceReplacementPlugin({
    controller,
    shouldProcessTransaction,
}: ResourceReplacementOptions) {
    type Application = {
        transaction: Transaction;
        states: WeakSet<EditorState>;
        previous?: Application;
    };
    // Only track state ancestry during a synchronous service dispatch. Speculative
    // states do not confirm acceptance unless the view actually installs them.
    let application: Application | undefined;

    function shouldProcessTransactionResources(tr: Transaction, state: EditorState) {
        return (
            controller.enabled &&
            isOriginalLocalDocumentChange(tr) &&
            (tr.getMeta('uiEvent') === 'drop' || !isSelectionInCode(state)) &&
            shouldProcessTransaction(tr, state)
        );
    }

    return new Plugin<ResourceReplacementState>({
        key: resourceReplacementKey,
        filterTransaction(tr, state) {
            if (isResourceReplacementCleanupTransaction(tr)) return true;
            if (tr.getMeta(resolvedResourceMeta)) return true;

            const batches = resourceReplacementKey.getState(state) ?? [];
            if ((controller.busy || batches.length) && isLocalHistoryTransaction(tr)) return false;
            if (!tr.docChanged) return true;

            if (shouldProcessTransactionResources(tr, state)) closeHistory(tr);
            return true;
        },
        state: {
            init: (_config, state) => {
                if (controller.enabled) validateResourceSchema(state.schema);
                return [];
            },
            apply(tr, batches, oldState, state) {
                for (let current = application; current; current = current.previous) {
                    if (tr === current.transaction || current.states.has(oldState))
                        current.states.add(state);
                }
                const meta = getResourceReplacementMeta(tr);
                if (!tr.docChanged && !meta) return batches;

                const mappedBatches = mapBatchRanges(batches, tr);
                const result = applyBatchMeta(mappedBatches, meta);
                if (shouldProcessTransactionResources(tr, oldState)) {
                    const addedRanges = collectAddedRangesInFinalDocument(tr);
                    const ranges = collectResourcesInRanges(state, addedRanges).map(
                        ({from, to}) => ({from, to}),
                    );
                    if (ranges.length) result.push({id: uuid(), ranges, started: false});
                }
                return result;
            },
        },
        view(view) {
            const lifetime = {destroyed: false};
            const starting = new Set<string>();

            function releaseBatch(id: string) {
                if (lifetime.destroyed || view.isDestroyed) return;
                view.dispatch(
                    setResourceReplacementMeta(view.state.tr, {type: 'release', id}).setMeta(
                        'addToHistory',
                        false,
                    ),
                );
                if (lifetime.destroyed || view.isDestroyed) return;
                if (resourceReplacementKey.getState(view.state)?.some((batch) => batch.id === id))
                    throw new Error(
                        'Resource replacement cleanup was rejected: filters and dispatch must accept cleanup transactions',
                    );
            }

            function applyReplacements(
                replacements: ReadonlyMap<string, string>,
                urlKeys: ReadonlySet<string>,
            ) {
                if (lifetime.destroyed || view.isDestroyed) throw new Error('Editor was destroyed');
                const state = view.state;
                const tr = prepareResourceReplacementTransaction(state, replacements, urlKeys);
                if (!tr) return;
                if (lifetime.destroyed || view.isDestroyed) throw new Error('Editor was destroyed');
                if (view.state !== state)
                    throw new Error('Editor changed during resource transformation');
                if (!view.editable) throw new Error('Editor is no longer editable');
                const current: Application = {
                    transaction: tr,
                    states: new WeakSet(),
                    previous: application,
                };
                application = current;
                try {
                    view.dispatch(tr);
                    if (!current.states.has(view.state))
                        throw new Error('Resource replacement was rejected');
                } finally {
                    application = current.previous;
                }
            }

            function startBatch(batch: ResourceBatch & {started: false}) {
                const {id} = batch;
                const entries = collectResourcesInRanges(view.state, batch.ranges);
                const resources = entries.map((item) => item.resource);
                const urlKeys = collectRequestedUrlKeys(entries);
                view.dispatch(
                    setResourceReplacementMeta(closeHistory(view.state.tr), {
                        type: 'start',
                        id,
                    }),
                );
                if (
                    lifetime.destroyed ||
                    view.isDestroyed ||
                    !resourceReplacementKey
                        .getState(view.state)
                        ?.some((current) => current.id === id && current.started)
                ) {
                    releaseBatch(id);
                    return;
                }
                const release = () => releaseBatch(id);
                const started = controller.start({
                    resources,
                    release,
                    apply: (replacements) => applyReplacements(replacements, urlKeys),
                });
                if (!started) release();
            }

            return {
                update() {
                    for (const {id} of resourceReplacementKey.getState(view.state) ?? []) {
                        const batch = resourceReplacementKey
                            .getState(view.state)
                            ?.find((current) => current.id === id);
                        if (!batch || batch.started || starting.has(id)) continue;
                        starting.add(id);
                        try {
                            startBatch(batch);
                        } catch (error) {
                            releaseBatch(id);
                            throw error;
                        } finally {
                            starting.delete(id);
                        }
                    }
                },
                destroy() {
                    lifetime.destroyed = true;
                },
            };
        },
    });
}
