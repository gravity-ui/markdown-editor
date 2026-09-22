import type {Node} from 'prosemirror-model';
import type {EditorState, Transaction} from 'prosemirror-state';

import {getParserFromState} from '../../../core/utils/parser';
import {
    type ResourceRange,
    resourceKey,
} from '../../../modules/resource-replacement/controller.utils';
import type {ReplacementResource} from '../../../modules/resource-replacement/types';
import {isUrlResource} from '../../../modules/resource-replacement/urls';

export function collectResourcesInRanges(state: EditorState, ranges: readonly ResourceRange[]) {
    const resources = new Map<number, ResourceRange & {resource: ReplacementResource}>();
    for (const range of ranges)
        state.doc.nodesBetween(range.from, range.to, (node, from) => {
            if (isCodeNode(node)) return false;
            const description = describeResource(node);
            const to = from + node.nodeSize;
            if (
                description &&
                from >= range.from &&
                to <= range.to &&
                (!isUrlResource(node.type.name, description) ||
                    getParserFromState(state).validateLink(node.attrs[description.valueAttribute]))
            ) {
                const name = description.nameAttribute && node.attrs[description.nameAttribute];
                resources.set(from, {
                    from,
                    to,
                    resource: {
                        kind: description.kind,
                        value: node.attrs[description.valueAttribute],
                        ...(typeof name === 'string' && name ? {name} : {}),
                    },
                });
            }
            return true;
        });
    return [...resources.values()].sort((a, b) => a.from - b.from);
}

export function collectAddedRangesInFinalDocument(tr: Transaction) {
    const ranges: ResourceRange[] = [];
    tr.mapping.maps.forEach((map, index) =>
        map.forEach((_from, _to, from, to) => {
            // A step's new range must pass through all subsequent steps.
            const rest = tr.mapping.slice(index + 1);
            if (from < to) ranges.push({from: rest.map(from, 1), to: rest.map(to, -1)});
        }),
    );
    return ranges;
}

export function describeResource(node: Node) {
    const resource = node.type.spec._resource;
    return resource && typeof node.attrs[resource.valueAttribute] === 'string'
        ? resource
        : undefined;
}

export function isCodeNode(node: Node) {
    return node.type.spec.code || node.marks.some((mark) => mark.type.spec.code);
}

export function collectRequestedUrlKeys(
    state: EditorState,
    entries: readonly (ResourceRange & {resource: ReplacementResource})[],
) {
    return new Set(
        entries.flatMap(({from, resource}) => {
            const node = state.doc.nodeAt(from);
            const description = node && describeResource(node);
            return node && description && isUrlResource(node.type.name, description)
                ? [resourceKey(resource)]
                : [];
        }),
    );
}
