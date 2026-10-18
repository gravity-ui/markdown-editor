import type {Node} from 'prosemirror-model';
import type {Transaction} from 'prosemirror-state';

import type {ResourceRange} from './types';

function positionsOfNode(doc: Node, range: ResourceRange, target: Node): number[] {
    const positions: number[] = [];
    doc.nodesBetween(range.from, range.to, (node, pos) => {
        if (node === target && pos >= range.from && pos + node.nodeSize <= range.to)
            positions.push(pos);
    });
    return positions;
}

/** Follow resource nodes only until resolve starts, including parent reconstruction. */
export function mapResourceRanges(
    ranges: readonly ResourceRange[],
    tr: Transaction,
    startStep = 0,
): ResourceRange[] {
    let result = [...ranges];
    for (let index = startStep; index < tr.mapping.maps.length; index++) {
        const map = tr.mapping.maps[index];
        const before = tr.docs[index];
        const after = tr.docs[index + 1] ?? tr.doc;
        result = result.flatMap((range) => {
            const from = map.map(range.from, 1);
            const to = map.map(range.to, -1);
            if (from < to) return [{from, to}];

            const node = before.nodeAt(range.from);
            if (!node || range.to !== range.from + node.nodeSize) return [];
            const recovered: ResourceRange[] = [];
            map.forEach((oldFrom, oldTo, newFrom, newTo) => {
                if (oldFrom > range.from || oldTo < range.to || newFrom === newTo) return;
                // Node identity alone is insufficient when the same immutable node
                // occurs more than once. Never guess which occurrence survived.
                if (positionsOfNode(before, {from: oldFrom, to: oldTo}, node).length !== 1) return;
                const positions = positionsOfNode(after, {from: newFrom, to: newTo}, node);
                if (positions.length === 1)
                    recovered.push({from: positions[0], to: positions[0] + node.nodeSize});
            });
            return recovered;
        });
    }
    return result;
}
