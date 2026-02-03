import type {ResolvedPos} from '#pm/model';
import {TextSelection} from '#pm/state';

/** @internal */
export function trimEmptyTableCells(sel: TextSelection): TextSelection {
    const {$from, $to} = sel;
    const from = trimTableEdgeCell($from, 'forward');
    const to = trimTableEdgeCell($to, 'backward');
    if ($from.pos === from && $to.pos === to) return sel;
    if (from > to) return TextSelection.create($from.doc, to, to);
    return TextSelection.create($from.doc, from, to);
}

/** @internal */
export function trimTableEdgeCell($pos: ResolvedPos, dir: 'backward' | 'forward'): number {
    let depth = $pos.depth;
    let isAtEdgeOfInlineBlocks = true;

    {
        const edgePos = dir === 'forward' ? $pos.end() : $pos.start();
        isAtEdgeOfInlineBlocks = $pos.pos === edgePos;
    }

    if (isAtEdgeOfInlineBlocks && !$pos.parent.isTextblock) {
        while (depth > 0) {
            const node = $pos.node(depth);
            const parentNode = $pos.node(depth - 1);

            if (node.isTextblock) {
                break;
            }

            const edgeNode = dir === 'forward' ? parentNode.lastChild : parentNode.firstChild;
            if (node !== edgeNode) {
                isAtEdgeOfInlineBlocks = false;
                break;
            }

            depth--;
        }
    }

    if (!isAtEdgeOfInlineBlocks || depth < 2) {
        return $pos.pos;
    }

    {
        const node = $pos.node(depth);
        const parentNode = $pos.node(depth - 1);

        const isInTable = node.type.spec.tableRole || parentNode.type.spec.tableRole;
        if (!isInTable || !node.isTextblock) {
            return $pos.pos;
        }

        if (!node.type.spec.tableRole) {
            // up to tableCell depth
            depth -= 1;

            // Check if we're at the edge of the cell (not just the textblock)
            const edgeNode = dir === 'forward' ? parentNode.lastChild : parentNode.firstChild;
            if (edgeNode !== node) {
                return $pos.pos;
            }
        }
    }

    while (depth > 0) {
        const node = $pos.node(depth);
        const parentNode = $pos.node(depth - 1);

        if (!node.type.spec.tableRole || !parentNode.type.spec.tableRole) break;

        const edgeNode = dir === 'forward' ? parentNode.lastChild : parentNode.firstChild;
        if (node !== edgeNode) break;

        depth--;
    }

    const newPos = dir === 'forward' ? $pos.after(depth) : $pos.before(depth);
    const sel = TextSelection.findFrom($pos.doc.resolve(newPos), dir === 'forward' ? 1 : -1);
    return sel?.anchor ?? $pos.pos;
}
