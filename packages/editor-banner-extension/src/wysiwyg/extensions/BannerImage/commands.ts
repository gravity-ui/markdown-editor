import {findSelectedNodeOfType} from '@gravity-ui/markdown-editor';
import {closeHistory} from '@gravity-ui/markdown-editor/pm/history';
import {type Command, type EditorState, Selection} from '@gravity-ui/markdown-editor/pm/state';
import {bannerImage, safeImageUrl} from '@gravity-ui/markdown-plugin-banner';

import {bannerContentNodeType} from '../BannerContent/BannerContentSpecs';
import {removeChild, selectNodeNear, setNodeAttrs, siblingBlockAcross} from '../commands';

import {bannerImageNodeType} from './BannerImageSpecs';

export const selectedBannerImage = (state: EditorState) =>
    findSelectedNodeOfType(bannerImageNodeType(state.schema))(state.selection) ?? null;

/** Each change is one undo step; an unsafe address is rejected. */
export const setBannerImageAttrs = setNodeAttrs(bannerImageNodeType, bannerImage, {
    accept: ({src}) => typeof src !== 'string' || safeImageUrl(src) !== null,
    history: true,
});

/** Removes the image in one undo step and puts the cursor into the nearest text. */
export const removeBannerImage =
    (pos: number): Command =>
    (state, dispatch) => {
        const node = state.doc.nodeAt(pos);
        if (node?.type !== bannerImageNodeType(state.schema)) return false;
        if (dispatch) {
            const tr = state.tr;
            removeChild(tr, state.doc.resolve(pos).parent, {node, pos});
            const $pos = tr.doc.resolve(pos);
            const selection =
                Selection.findFrom($pos, $pos.nodeAfter ? 1 : -1, true) ?? Selection.near($pos);
            dispatch(closeHistory(tr.setSelection(selection).scrollIntoView()));
        }
        return true;
    };

export const removeSelectedBannerImage: Command = (state, dispatch, view) => {
    const selected = selectedBannerImage(state);
    return selected !== null && removeBannerImage(selected.pos)(state, dispatch, view);
};

const selectBannerImageNear = selectNodeNear(
    bannerImageNodeType,
    siblingBlockAcross(bannerContentNodeType),
);

/** Backspace at the start of the block after the image selects the image. */
export const selectBannerImageBefore = selectBannerImageNear(-1);
/** Delete at the end of the block before the image selects the image. */
export const selectBannerImageAfter = selectBannerImageNear(1);
