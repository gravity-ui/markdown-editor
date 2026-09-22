import type {Node} from 'prosemirror-model';
import type {EditorState, Transaction} from 'prosemirror-state';
import type {StepMap} from 'prosemirror-transform';

import {type ResourceRange, overlaps} from '../../../modules/resource-replacement/controller.utils';

import {collectResourcesInRanges} from './collect-resources';
import type {ResourceReplacementState} from './types';

function stepOverlapsProtectedRanges(map: StepMap, ranges: readonly ResourceRange[]) {
    let overlapsProtectedRange = false;
    map.forEach((from, to) => {
        if (ranges.some((range) => overlaps(range, from, to))) overlapsProtectedRange = true;
    });
    return overlapsProtectedRange;
}

function stepChangesProtectedNodes(
    before: Node,
    after: Node,
    map: StepMap,
    ranges: readonly ResourceRange[],
) {
    // Attribute and mark steps can change a protected node without a changed range.
    return ranges.some(
        (range) => !after.nodeAt(map.map(range.from, 1))?.eq(before.nodeAt(range.from)!),
    );
}

export function changesProtectedResources(
    tr: Transaction,
    state: EditorState,
    batches: ResourceReplacementState,
) {
    let ranges = batches
        .filter((batch) => batch.started)
        .flatMap((batch) => collectResourcesInRanges(state, batch.ranges));

    for (let index = 0; index < tr.steps.length; index++) {
        const map = tr.mapping.maps[index];
        const overlapsProtectedRanges = stepOverlapsProtectedRanges(map, ranges);
        const changesProtectedNodes = stepChangesProtectedNodes(
            tr.docs[index],
            tr.docs[index + 1] ?? tr.doc,
            map,
            ranges,
        );
        if (overlapsProtectedRanges || changesProtectedNodes) return true;

        // The next step uses the document and positions produced by this step.
        ranges = ranges.map((range) => ({
            ...range,
            from: map.map(range.from, 1),
            to: map.map(range.to, -1),
        }));
    }
    return false;
}
