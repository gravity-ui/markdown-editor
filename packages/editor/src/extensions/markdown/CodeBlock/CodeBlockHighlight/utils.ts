import type {Node} from '#pm/model';
import type {Transaction} from '#pm/state';
import {AttrStep} from '#pm/transform';

import {CodeBlockNodeAttr} from '../CodeBlockSpecs';

/** @internal */
export function isLineNumbersVisible(node: Node): boolean {
    return node.attrs[CodeBlockNodeAttr.ShowLineNumbers] === 'true';
}

/** @internal */
export function getChangedRanges(tr: Transaction): {from: number; to: number}[] {
    const ranges: {from: number; to: number}[] = [];
    const {maps} = tr.mapping;

    tr.steps.forEach((step, i) => {
        if (step instanceof AttrStep) {
            let pos = step.pos;
            for (let j = i + 1; j < maps.length; j++) {
                pos = maps[j].map(pos);
            }
            const node = tr.doc.nodeAt(pos);
            if (node) {
                ranges.push({from: pos, to: pos + node.nodeSize});
            }
            return;
        }

        step.getMap().forEach((_oldStart, _oldEnd, newStart, newEnd) => {
            let from = newStart;
            let to = newEnd;
            for (let j = i + 1; j < maps.length; j++) {
                from = maps[j].map(from, -1);
                to = maps[j].map(to, 1);
            }
            ranges.push({from, to});
        });
    });

    return ranges;
}
