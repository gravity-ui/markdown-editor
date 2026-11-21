import {get$Cursor, pType} from '@gravity-ui/markdown-editor';
import {chainCommands} from '@gravity-ui/markdown-editor/pm/commands';
import {type Command, Selection, TextSelection} from '@gravity-ui/markdown-editor/pm/state';
import {bannerTitle} from '@gravity-ui/markdown-plugin-banner';

import {bannerNodeType} from '../Banner/BannerSpecs/const';
import {bannerContentNodeType} from '../BannerContent/BannerContentSpecs';
import {setNodeAttrs, siblingBlock, stopAtBlockEdge} from '../commands';

import {bannerTitleNodeType} from './BannerTitleSpecs';

export const setBannerTitleAttrs = setNodeAttrs(bannerTitleNodeType, bannerTitle);

export const leaveBannerTitle: Command = (state, dispatch) => {
    const {$from, $to, empty} = state.selection;
    if ($from.parent.type !== bannerTitleNodeType(state.schema)) return false;
    const after = $from.after();
    const next = $from.sameParent($to) ? state.doc.nodeAt(after) : null;
    if (next?.type === bannerContentNodeType(state.schema)) {
        if (dispatch) {
            const selection = Selection.near(state.doc.resolve(after + 1), 1);
            dispatch(state.tr.setSelection(selection).scrollIntoView());
        }
        return true;
    }
    const container = $from.node(-1);
    const index = $from.indexAfter(-1);
    const paragraph = pType(state.schema);
    if (
        dispatch &&
        empty &&
        $from.pos === $from.end() &&
        container.type !== bannerNodeType(state.schema) &&
        container.canReplaceWith(index, index, paragraph)
    ) {
        const tr = state.tr.insert(after, paragraph.create());
        dispatch(tr.setSelection(TextSelection.create(tr.doc, after + 1)).scrollIntoView());
    }
    return true;
};

export const deleteBannerTitleText: Command = (state, dispatch) => {
    const {$from, $to, empty} = state.selection;
    if (empty || $from.parent.type !== bannerTitleNodeType(state.schema)) return false;
    if ($from.parentOffset > 0 || $to.pos <= $from.end()) return false;
    if (dispatch) {
        const tr = state.tr.delete($from.pos, $from.end());
        tr.deleteRange(tr.mapping.map($from.after()), tr.mapping.map($to.pos));
        tr.setSelection(TextSelection.create(tr.doc, $from.pos));
        dispatch(tr.scrollIntoView());
    }
    return true;
};

const holdBannerTitleEdge =
    (dir: -1 | 1): Command =>
    (state) => {
        const $cursor = get$Cursor(state.selection);
        if ($cursor?.parent.type !== bannerTitleNodeType(state.schema)) return false;
        const sibling = siblingBlock($cursor, dir);
        return Boolean(sibling && !sibling.node.isAtom);
    };

const stopAtBannerTitleEdge = (dir: -1 | 1) =>
    chainCommands(holdBannerTitleEdge(dir), stopAtBlockEdge(bannerTitleNodeType)(dir));

export const stopAtBannerTitleStart = stopAtBannerTitleEdge(-1);
export const stopAtBannerTitleEnd = stopAtBannerTitleEdge(1);
