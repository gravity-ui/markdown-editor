import {findSelectedNodeOfType} from '@gravity-ui/markdown-editor';
import {closeHistory} from '@gravity-ui/markdown-editor/pm/history';
import {type Command, type EditorState, Selection} from '@gravity-ui/markdown-editor/pm/state';
import {bannerImage, bannerImageDefaults, safeImageUrl} from '@gravity-ui/markdown-plugin-banner';

import {removeChild, selectNodeNear, setNodeAttrs, siblingBlock} from '../commands';

import {bannerImageNodeType} from './BannerImageSpecs';

export const selectedBannerImage = (state: EditorState) =>
    findSelectedNodeOfType(bannerImageNodeType(state.schema))(state.selection) ?? null;

export const setBannerImageAttrs = setNodeAttrs(bannerImageNodeType, bannerImage, {
    accept: ({src}) => typeof src !== 'string' || safeImageUrl(src) !== null,
    history: true,
});

export const resetBannerImage = (pos: number) => setBannerImageAttrs(pos, bannerImageDefaults);

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

const selectBannerImageNear = selectNodeNear(bannerImageNodeType, siblingBlock);

export const selectBannerImageBefore = selectBannerImageNear(-1);
export const selectBannerImageAfter = selectBannerImageNear(1);
