import {closeHistory} from 'prosemirror-history';
import {type EditorState, Plugin, type Transaction} from 'prosemirror-state';
import {AttrStep} from 'prosemirror-transform';
import type {EditorView} from 'prosemirror-view';
import {v4 as uuid} from 'uuid';

import {getParserFromState} from '../../../core/utils/parser';
import {type ResourceOccurrence, type ResourceTarget, replaceResourceId} from '../tracking';

import {applyResolvedResources, resourceReplacementTransaction} from './commands';
import {describeResource, validateResourceUrl} from './document-utils';
import {resourceHistoryKey, retainedHistoryTargets} from './history';
import {
    type ResourceRange,
    type ResourceReplacementMeta,
    type ResourceReplacementState,
    remoteTransactionMeta,
    resolvedResourceMeta,
    resourceReplacementKey,
} from './key';
import type {ResourceReplacementOptions} from './options';

function isHistoryTransaction(tr: Transaction) {
    return Boolean(resourceHistoryKey && tr.getMeta(resourceHistoryKey));
}

function isRemote(tr: Transaction) {
    return Boolean(tr.getMeta(remoteTransactionMeta) || tr.getMeta('rebased'));
}

/** Observe selected transactions independently of their source. */
export function resourceReplacementPlugin({
    host,
    shouldTrack,
    getSource,
}: ResourceReplacementOptions) {
    function isTrackedTransaction(tr: Transaction, state: EditorState) {
        return Boolean(
            tr.docChanged &&
            !tr.getMeta('appendedTransaction') &&
            !tr.getMeta(resourceReplacementKey) &&
            !isRemote(tr) &&
            !isHistoryTransaction(tr) &&
            !tr.getMeta(resolvedResourceMeta) &&
            // Drop inserts at its own coordinates, independently of the old selection.
            // The inserted nodes are checked for code below when collecting resources.
            (tr.getMeta('uiEvent') === 'drop' ||
                (!state.selection.$from.parent.type.spec.code &&
                    !(state.storedMarks ?? state.selection.$from.marks()).some(
                        (mark) => mark.type.spec.code,
                    ))) &&
            shouldTrack(tr, state),
        );
    }

    function trackInsertedResources(state: EditorState) {
        const pending = resourceReplacementKey.getState(state);
        if (!pending?.ranges.length) return null;
        const tr = state.tr;
        const targets: ResourceTarget[] = [];
        state.doc.descendants((node, pos) => {
            if (node.type.spec.code || node.marks.some((mark) => mark.type.spec.code)) return false;
            const resource = describeResource(node);
            if (!resource || !pending.ranges.some(({from, to}) => pos >= from && pos < to))
                return true;
            const attr = resource.urlAttribute;
            const previous = pending.targets.find(
                (target) =>
                    target.id === node.attrs[replaceResourceId] &&
                    target.resource.path === node.attrs[attr] &&
                    target.resource.kind === resource?.kind,
            );
            if (previous) targets.push(previous);
            else {
                const target: ResourceTarget = {
                    id: uuid(),
                    resource: {
                        kind: resource.kind,
                        path: node.attrs[attr],
                        ...(resource?.nameAttribute && node.attrs[resource.nameAttribute]
                            ? {name: node.attrs[resource.nameAttribute]}
                            : {}),
                    },
                };
                targets.push(target);
                tr.setNodeAttribute(pos, replaceResourceId, target.id);
            }
            return true;
        });
        return tr.docChanged ? tr.setMeta(resourceReplacementKey, {type: 'insert', targets}) : null;
    }

    function detachEditedResources(transactions: readonly Transaction[], state: EditorState) {
        const detached = new Set<string>();
        for (const tr of transactions) {
            const root = tr.getMeta('appendedTransaction') as Transaction | undefined;
            if (
                !tr.docChanged ||
                tr.getMeta(resolvedResourceMeta) ||
                isRemote(tr) ||
                isHistoryTransaction(tr) ||
                (root && (isHistoryTransaction(root) || isRemote(root)))
            )
                continue;
            const before = new Map<string, string>();
            tr.before.descendants((node) => {
                const resource = describeResource(node);
                const attr = resource?.urlAttribute;
                const id = node.attrs[replaceResourceId];
                if (attr && id) before.set(id, node.attrs[attr]);
            });
            tr.doc.descendants((node) => {
                const resource = describeResource(node);
                const attr = resource?.urlAttribute;
                const id = node.attrs[replaceResourceId];
                if (attr && before.has(id) && before.get(id) !== node.attrs[attr]) detached.add(id);
            });
        }
        if (!detached.size) return null;
        const tr = state.tr;
        state.doc.descendants((node, pos) => {
            if (detached.has(node.attrs[replaceResourceId]))
                tr.setNodeAttribute(pos, replaceResourceId, null);
        });
        return tr.docChanged ? tr : null;
    }

    function getSnapshot(state: EditorState) {
        const result: ResourceOccurrence[] = [];
        state.doc.descendants((node) => {
            if (node.type.spec.code || node.marks.some((mark) => mark.type.spec.code)) return false;
            const resource = describeResource(node);
            const attr = resource?.urlAttribute;
            if (resource && attr)
                result.push({
                    kind: resource.kind,
                    path: node.attrs[attr],
                    targetId: node.attrs[replaceResourceId] || undefined,
                });
            return true;
        });
        return result;
    }

    function restoreSnapshot(view: EditorView, snapshot: ResourceOccurrence[]) {
        const current = getSnapshot(view.state);
        // Mode conversion must preserve the complete ordered resource list.
        if (
            current.length !== snapshot.length ||
            current.some(
                (item, index) =>
                    item.kind !== snapshot[index].kind || item.path !== snapshot[index].path,
            )
        )
            return;
        const tr = view.state.tr;
        let index = 0;
        tr.doc.descendants((node, pos) => {
            if (node.type.spec.code || node.marks.some((mark) => mark.type.spec.code)) return false;
            if (describeResource(node)) {
                const id = snapshot[index++].targetId;
                if (id && host.getTarget(id)) tr.setNodeAttribute(pos, replaceResourceId, id);
            }
            return true;
        });
        if (tr.docChanged) view.dispatch(tr.setMeta('addToHistory', false));
    }

    return new Plugin<ResourceReplacementState>({
        key: resourceReplacementKey,
        // History must see the boundary on the selected transaction before applying it.
        // Only metadata is added here; document changes and requests happen later.
        filterTransaction: (tr, state) => {
            if (isTrackedTransaction(tr, state)) closeHistory(tr);
            return true;
        },
        state: {
            init: () => ({ranges: [], targets: []}),
            apply: (tr, value, oldState) => {
                const meta = tr.getMeta(resourceReplacementKey) as
                    | ResourceReplacementMeta
                    | undefined;
                if (meta?.type === 'complete') return {ranges: [], targets: []};
                if (meta?.type === 'insert') return {...value, targets: meta.targets};
                if (isTrackedTransaction(tr, oldState)) {
                    const ranges: ResourceRange[] = [];
                    tr.mapping.maps.forEach((map, index) => {
                        const remaining = tr.mapping.slice(index + 1);
                        const step = tr.steps[index];
                        // AttrStep has an empty StepMap despite changing a resource URL.
                        if (step instanceof AttrStep) {
                            const node = tr.docs[index].nodeAt(step.pos);
                            const resource = node && describeResource(node);
                            if (node && resource?.urlAttribute === step.attr)
                                ranges.push({
                                    from: remaining.map(step.pos, 1),
                                    to: remaining.map(step.pos + node.nodeSize, -1),
                                });
                        }

                        map.forEach((_from, _to, from, to) => {
                            if (from < to)
                                ranges.push({
                                    from: remaining.map(from, 1),
                                    to: remaining.map(to, -1),
                                });
                        });
                    });
                    return {ranges, targets: [], source: getSource?.(tr)};
                }
                if (!tr.docChanged || !value.ranges.length) return value;
                return {
                    ...value,
                    ranges: value.ranges
                        .map(({from, to}) => ({
                            from: tr.mapping.map(from, 1),
                            to: tr.mapping.map(to, -1),
                        }))
                        .filter(({from, to}) => from < to),
                };
            },
        },
        appendTransaction: (transactions, _old, state) => {
            if (!transactions.some((tr) => tr.docChanged)) return null;
            // Detachment is part of the user's edit and is restored by its Undo.
            // Keep it separate from replacements, which must not enter history.
            return (
                trackInsertedResources(state) ||
                detachEditedResources(transactions, state) ||
                resourceReplacementTransaction(state, host)
            );
        },
        view: (view) => {
            const started = new WeakSet<readonly ResourceTarget[]>();
            const unregister = host.register({
                snapshot: () => getSnapshot(view.state),
                restore: (snapshot) => restoreSnapshot(view, snapshot),
                retainedTargets: () => {
                    const historyIds = retainedHistoryTargets(view.state);
                    if (!historyIds) return undefined;
                    const ids = new Set(historyIds);
                    view.state.doc.descendants((node) => {
                        const id = node.attrs[replaceResourceId];
                        if (typeof id === 'string') ids.add(id);
                    });
                    return ids;
                },
                forgetTargets: (ids) => {
                    const tr = view.state.tr;
                    view.state.doc.descendants((node, pos) => {
                        if (ids.has(node.attrs[replaceResourceId]))
                            tr.setNodeAttribute(pos, replaceResourceId, null);
                    });
                    if (tr.docChanged)
                        view.dispatch(
                            tr
                                .setMeta('addToHistory', false)
                                .setMeta(resourceReplacementKey, {type: 'collect'}),
                        );
                },
                flush: () => {
                    if (view.isDestroyed) throw new Error('Editor was destroyed');
                    if (!resourceReplacementTransaction(view.state, host)) return;
                    if (!applyResolvedResources(host)(view.state, view.dispatch, view))
                        throw new Error('Editor is no longer editable');
                    if (resourceReplacementTransaction(view.state, host))
                        throw new Error('Resource replacement was rejected');
                },
            });
            return {
                update: () => {
                    host.collectGarbage?.();
                    const value = resourceReplacementKey.getState(view.state);
                    if (
                        (!value?.ranges.length && !value?.targets.length) ||
                        started.has(value.targets)
                    )
                        return;
                    started.add(value.targets);
                    // Complete the batch and close history before callbacks can dispatch edits.
                    view.dispatch(
                        closeHistory(view.state.tr).setMeta(resourceReplacementKey, {
                            type: 'complete',
                        }),
                    );
                    if (resourceReplacementKey.getState(view.state)?.targets === value.targets)
                        return;
                    const present = new Set(getSnapshot(view.state).map((item) => item.targetId));
                    const targets = value.targets.filter((target) => present.has(target.id));
                    if (!targets.length) return;
                    host.resolve(
                        targets,
                        (path) => validateResourceUrl(getParserFromState(view.state), path),
                        value.source,
                    );
                },
                destroy: unregister,
            };
        },
    });
}
