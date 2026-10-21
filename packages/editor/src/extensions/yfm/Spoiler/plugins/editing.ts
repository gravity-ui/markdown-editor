import type {MarkType, Node} from '#pm/model';
import {type EditorState, Plugin} from '#pm/state';
import {Decoration, DecorationSet} from '#pm/view';

import {SpoilerClassName, spoilerType} from '../SpoilerSpecs';

export type SpoilerRange = {from: number; to: number};

/**
 * Marks the spoilers that the selection touches.
 * The styles show the text of these spoilers while the editor has focus.
 * The plugin changes only decorations, so the document and the history stay the same.
 */
export const spoilerEditingPlugin = () =>
    new Plugin({
        props: {
            decorations(state) {
                const ranges = findSelectedSpoilers(state, spoilerType(state.schema));
                if (!ranges.length) return DecorationSet.empty;

                return DecorationSet.create(
                    state.doc,
                    ranges.map(({from, to}) =>
                        Decoration.inline(from, to, {class: SpoilerClassName.Editing}),
                    ),
                );
            },
        },
    });

/** Returns the full ranges of spoilers that intersect or touch the selection. */
export function findSelectedSpoilers(state: EditorState, type: MarkType): SpoilerRange[] {
    const {from, to} = state.selection;
    const ranges: SpoilerRange[] = [];

    state.doc.nodesBetween(from, to, (node, pos) => {
        if (!node.isTextblock) return true;
        for (const range of getSpoilerRanges(node, pos + 1, type)) {
            if (range.from <= to && range.to >= from) ranges.push(range);
        }
        return false;
    });

    return ranges;
}

function getSpoilerRanges(textblock: Node, start: number, type: MarkType): SpoilerRange[] {
    const ranges: SpoilerRange[] = [];
    let current: SpoilerRange | null = null;

    textblock.forEach((child, offset) => {
        const pos = start + offset;
        if (type.isInSet(child.marks)) {
            if (current) current.to = pos + child.nodeSize;
            else ranges.push((current = {from: pos, to: pos + child.nodeSize}));
        } else {
            current = null;
        }
    });

    return ranges;
}
