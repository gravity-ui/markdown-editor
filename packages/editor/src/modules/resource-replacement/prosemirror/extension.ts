import {closeHistory} from 'prosemirror-history';
import {type EditorState, Plugin, type Transaction} from 'prosemirror-state';
import {v4 as uuid} from 'uuid';

import type {ExtensionAuto} from '../../../core/ExtensionBuilder';
import {resourceKey} from '../controller.utils';
import {isUrlResource} from '../urls';

import {resolvedResourceMeta, resourceReplacementKey} from './const';
import type {
    ResourceReplacementMeta,
    ResourceReplacementOptions,
    ResourceReplacementState,
} from './types';
import {
    applyBatchMeta,
    changesProtectedResources,
    collectAddedRangesInFinalDocument,
    collectResourceDecorations,
    collectResourcesInRanges,
    describeResource,
    isHistoryTransaction,
    isOriginalLocalDocumentChange,
    isSelectionInCode,
    mapBatchRanges,
    resourceReplacementTransaction,
} from './utils';

export const ResourceReplacement: ExtensionAuto<ResourceReplacementOptions> = (
    builder,
    options,
) => {
    for (const nodeType of builder.nodeSpecNames()) {
        builder.overrideNodeSpec(nodeType, (spec) => {
            const resource = spec._resource;
            if (
                resource &&
                (!resource.kind ||
                    !resource.valueAttribute ||
                    !spec.attrs?.[resource.valueAttribute])
            )
                throw new Error(`Invalid resource description: ${nodeType}`);
            return spec;
        });
    }
    builder.addPlugin(() => resourceReplacementPlugin(options), builder.Priority.Lowest);
};

/** Requests start in view.update, only after the editor accepts the insertion. */
function resourceReplacementPlugin({controller, shouldTrack}: ResourceReplacementOptions) {
    function isTracked(tr: Transaction, state: EditorState) {
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

            if (isTracked(tr, state)) closeHistory(tr);
            return true;
        },
        state: {
            init: () => [],
            apply(tr, batches, oldState, state) {
                const meta = tr.getMeta(resourceReplacementKey) as
                    | ResourceReplacementMeta
                    | undefined;
                if (!tr.docChanged && !meta) return batches;

                const mappedBatches = mapBatchRanges(batches, tr.mapping);
                const result = applyBatchMeta(mappedBatches, meta);
                if (isTracked(tr, oldState)) {
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
                return collectResourceDecorations(state, batches);
            },
        },
        view(view) {
            const lifetime = {destroyed: false};

            function releaseBatch(id: string) {
                if (!lifetime.destroyed && !view.isDestroyed)
                    view.dispatch(
                        view.state.tr
                            .setMeta(resourceReplacementKey, {type: 'release', id})
                            .setMeta('addToHistory', false),
                    );
            }

            function applyReplacements(
                replacements: ReadonlyMap<string, string>,
                urlKeys: ReadonlySet<string>,
            ) {
                if (lifetime.destroyed || view.isDestroyed) throw new Error('Editor was destroyed');
                const tr = resourceReplacementTransaction(view.state, replacements, urlKeys);
                if (!tr) return;
                if (!view.editable) throw new Error('Editor is no longer editable');
                view.dispatch(tr);
                if (!view.state.doc.eq(tr.doc))
                    throw new Error('Resource replacement was rejected');
            }

            return {
                update() {
                    for (const batch of resourceReplacementKey.getState(view.state) ?? []) {
                        if (batch.started) continue;
                        const entries = collectResourcesInRanges(view.state, batch.ranges);
                        const resources = entries.map((item) => item.resource);
                        const urlKeys = new Set(
                            entries.flatMap(({from, resource}) => {
                                const node = view.state.doc.nodeAt(from);
                                const description = node && describeResource(node);
                                return node &&
                                    description &&
                                    isUrlResource(node.type.name, description)
                                    ? [resourceKey(resource)]
                                    : [];
                            }),
                        );
                        // Mark the batch before starting a request that may dispatch synchronously.
                        view.dispatch(
                            closeHistory(view.state.tr).setMeta(resourceReplacementKey, {
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
                },
                destroy() {
                    lifetime.destroyed = true;
                },
            };
        },
    });
}
