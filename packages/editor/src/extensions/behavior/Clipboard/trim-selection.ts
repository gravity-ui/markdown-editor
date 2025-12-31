import type {ResolvedPos} from '#pm/model';
import {TextSelection} from '#pm/state';

/** @internal */
export function trimTextSelection(sel: TextSelection): TextSelection {
    const {$from, $to} = sel;
    const from = trimTextSelectionOnEdge($from, 'forward');
    const to = trimTextSelectionOnEdge($to, 'backward');
    if ($from.pos === from && $to.pos === to) return sel;
    if (from > to) return TextSelection.create($from.doc, to, to);
    return TextSelection.create($from.doc, from, to);
}

/** @internal */
export function trimTextSelectionOnEdge($pos: ResolvedPos, dir: 'backward' | 'forward'): number {
    let depth = $pos.depth;
    let isAtTextblockEdge = true;

    {
        const edgePos = dir === 'forward' ? $pos.end() : $pos.start();
        isAtTextblockEdge = $pos.pos === edgePos;
    }

    if (isAtTextblockEdge && !$pos.parent.isTextblock) {
        while (depth > 0) {
            const node = $pos.node(depth);
            const parentNode = $pos.node(depth - 1);

            if (node.isTextblock) {
                break;
            }

            const edgeNode = dir === 'forward' ? parentNode.lastChild : parentNode.firstChild;
            if (node !== edgeNode) {
                isAtTextblockEdge = false;
                break;
            }

            depth--;
        }
    }

    if (!isAtTextblockEdge || depth < 1 || !$pos.node(depth).isTextblock) {
        return $pos.pos;
    }

    while (depth > 0) {
        const node = $pos.node(depth);
        const parentNode = $pos.node(depth - 1);

        const edgeNode = dir === 'forward' ? parentNode.lastChild : parentNode.firstChild;
        if (node !== edgeNode) break;

        depth--;
    }

    const newPos = dir === 'forward' ? $pos.after(depth) : $pos.before(depth);
    const sel = TextSelection.findFrom($pos.doc.resolve(newPos), dir === 'forward' ? 1 : -1);
    return sel?.anchor ?? $pos.pos;
}
