import type {Node} from 'prosemirror-model';
import type {EditorState, Transaction} from 'prosemirror-state';

import {getParserFromState} from '../../../core/utils/parser';
import {
    type NodeResource,
    isCodeNode,
    readNodeResource,
} from '../../../modules/resource-replacement/read-node-resource';

import {mapResourceRanges} from './map-resource-ranges';
import type {ResourceRange} from './types';

export function collectResourcesInRanges(state: EditorState, ranges: readonly ResourceRange[]) {
    const resources = new Map<number, ResourceRange & NodeResource>();
    for (const range of ranges)
        state.doc.nodesBetween(range.from, range.to, (node, from) => {
            if (isCodeNode(node)) return false;
            const to = from + node.nodeSize;
            if (from >= range.from && to <= range.to) {
                const entry = readNodeResource(node, getParserFromState(state));
                if (entry) resources.set(from, {from, to, ...entry});
            }
            return true;
        });
    return [...resources.values()].sort((a, b) => a.from - b.from);
}

export function collectAddedRangesInFinalDocument(tr: Transaction) {
    const ranges: ResourceRange[] = [];
    tr.mapping.maps.forEach((map, index) =>
        map.forEach((oldFrom, oldTo, from, to) => {
            if (from === to) return;
            const before = tr.docs[index];
            const after = tr.docs[index + 1] ?? tr.doc;
            const retained = new Set<Node>();
            // The initial transfer may legitimately reuse the selected node. Only
            // subsequent parent reconstruction retains resources from prior steps.
            if (index > 0)
                before.nodesBetween(oldFrom, oldTo, (node, pos) => {
                    if (node.type.spec._resource && pos > oldFrom && pos + node.nodeSize < oldTo)
                        retained.add(node);
                });
            const added: ResourceRange[] = [];
            after.nodesBetween(from, to, (node, pos) => {
                // A rebuilt parent is not a new insertion of its existing resources.
                if (
                    node.type.spec._resource &&
                    !retained.has(node) &&
                    pos >= from &&
                    pos + node.nodeSize <= to
                )
                    added.push({from: pos, to: pos + node.nodeSize});
            });
            ranges.push(...mapResourceRanges(added, tr, index + 1));
        }),
    );
    return ranges;
}
