import type {Node} from '@gravity-ui/markdown-editor/pm/model';
import {type EditorState, Plugin, type Transaction} from '@gravity-ui/markdown-editor/pm/state';
import {Mapping} from '@gravity-ui/markdown-editor/pm/transform';

import {bannerNodeType} from '../../../Banner/BannerSpecs/const';
import {bannerContentNodeType} from '../../BannerContentSpecs';

/** The top-level blocks touched by the transactions, in the new document. */
function changedBlocks(trs: readonly Transaction[], doc: Node) {
    const maps = trs.flatMap((tr) => tr.mapping.maps);
    let from = doc.content.size;
    let to = 0;
    maps.forEach((map, index) => {
        const after = new Mapping(maps.slice(index + 1));
        map.forEach((_oldStart, _oldEnd, start, end) => {
            from = Math.min(from, after.map(start, -1));
            to = Math.max(to, after.map(end, 1));
        });
    });
    if (from > to) return null;
    const $from = doc.resolve(from);
    const $to = doc.resolve(to);
    return {
        from: $from.depth ? $from.before(1) : $from.pos,
        to: $to.depth ? $to.after(1) : $to.pos,
    };
}

/**
 * The positions of the descriptions to unwrap: one that is not a child block of a banner,
 * or that follows another description in the same banner.
 */
export function misplacedBannerContents(doc: Node, from = 0, to = doc.content.size) {
    const schema = doc.type.schema;
    const contentType = bannerContentNodeType(schema);
    const bannerType = bannerNodeType(schema);
    const found: number[] = [];
    const described = new Set<Node>();
    doc.nodesBetween(from, to, (node, pos, parent) => {
        if (node.type === contentType) {
            const inBanner = parent?.type === bannerType;
            if (!inBanner || described.has(parent)) found.push(pos);
            else described.add(parent);
        }
        return !node.isTextblock;
    });
    return found;
}

/** Replaces each misplaced description with its blocks; the last ones go first, so positions stay valid. */
export function unwrapBannerContents(tr: Transaction, positions: readonly number[]) {
    for (const pos of [...positions].sort((a, b) => b - a)) {
        const node = tr.doc.nodeAt(pos);
        if (node) tr.replaceWith(pos, pos + node.nodeSize, node.content);
    }
    return tr;
}

/** Pasted or dropped descriptions outside a banner, or a second one in a banner, become their blocks. */
export const bannerContentUnwrapPlugin = () =>
    new Plugin({
        appendTransaction: (trs, _oldState, state: EditorState) => {
            if (!trs.some((tr) => tr.docChanged)) return null;
            const range = changedBlocks(trs, state.doc);
            if (!range) return null;
            const positions = misplacedBannerContents(state.doc, range.from, range.to);
            return positions.length ? unwrapBannerContents(state.tr, positions) : null;
        },
    });
