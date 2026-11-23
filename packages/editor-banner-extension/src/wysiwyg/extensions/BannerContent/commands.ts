import {get$Cursor, pType} from '@gravity-ui/markdown-editor';
import {chainCommands} from '@gravity-ui/markdown-editor/pm/commands';
import type {Node} from '@gravity-ui/markdown-editor/pm/model';
import {type Command, type EditorState, TextSelection} from '@gravity-ui/markdown-editor/pm/state';

import {findDepth, textRange} from '../../plugins/SelectionInsidePlugin';
import {atTextblockEdge, stopAtBlockEdge} from '../commands';

import {bannerContentNodeType} from './BannerContentSpecs';

const isBannerContent = (state: EditorState, node: Node | null | undefined) =>
    node?.type === bannerContentNodeType(state.schema);

/** Enter in an empty paragraph of the description does nothing, so the text never leaves the block. */
export const keepEmptyBannerContentText: Command = (state) =>
    state.selection.empty &&
    state.selection.$from.parent.content.size === 0 &&
    isBannerContent(state, state.selection.$from.node(-1));

/** Deleting all the text of the description leaves an empty paragraph in it. */
export const clearBannerContent: Command = (state, dispatch) => {
    const {$from, $to, from, to} = state.selection;
    const depth = findDepth($from, bannerContentNodeType(state.schema), $from.sharedDepth(to));
    if (!depth || ($from.parent.isTextblock && $from.sameParent($to))) return false;
    const {first, last} = textRange(state.doc, $from, depth);
    if (!first || !last || from > first.from || to < last.to) return false;
    if (dispatch) {
        const start = $from.depth > depth ? $from.before(depth + 1) : from;
        const end = $to.depth > depth ? $to.after(depth + 1) : to;
        const tr = state.tr.replaceWith(start, end, pType(state.schema).create());
        dispatch(tr.setSelection(TextSelection.create(tr.doc, start + 1)).scrollIntoView());
    }
    return true;
};

const edgeIsTextblock = (node: Node, dir: -1 | 1) => {
    let edge: Node | null = node;
    while (edge && !edge.isTextblock) edge = dir < 0 ? edge.lastChild : edge.firstChild;
    return Boolean(edge);
};

const holdBannerContentEdge =
    (dir: -1 | 1): Command =>
    (state) => {
        const $cursor = get$Cursor(state.selection);
        if (!$cursor || !atTextblockEdge($cursor, dir)) return false;
        const container = $cursor.node(-1);
        if (!isBannerContent(state, container)) return false;
        return $cursor.index(-1) === (dir < 0 ? 0 : container.childCount - 1);
    };

/** Backspace at the start and Delete at the end of the description do not join it with the blocks around it. */
const stopAtBannerContentEdge = (dir: -1 | 1) =>
    chainCommands(
        holdBannerContentEdge(dir),
        stopAtBlockEdge(bannerContentNodeType, {pass: edgeIsTextblock})(dir),
    );

export const stopAtBannerContentStart = stopAtBannerContentEdge(-1);
export const stopAtBannerContentEnd = stopAtBannerContentEdge(1);
