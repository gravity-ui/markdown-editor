import {findSelectedNodeOfType} from '@gravity-ui/markdown-editor';
import {closeHistory} from '@gravity-ui/markdown-editor/pm/history';
import {type Command, type EditorState, Selection} from '@gravity-ui/markdown-editor/pm/state';
import {headerImage, safeImageUrl} from '@gravity-ui/markdown-plugin-header';

import {removeChild, selectNodeNear, setNodeAttrs, siblingBlock} from '../commands';

import {headerImageNodeType} from './HeaderImageSpecs';

export const selectedHeaderImage = (state: EditorState) =>
    findSelectedNodeOfType(headerImageNodeType(state.schema))(state.selection) ?? null;

/** Each change is one undo step; an unsafe address is rejected. */
export const setHeaderImageAttrs = setNodeAttrs(headerImageNodeType, headerImage, {
    accept: ({src}) => typeof src !== 'string' || safeImageUrl(src) !== null,
    history: true,
});

/** Removes the image in one undo step and puts the cursor into the nearest text. */
export const removeHeaderImage =
    (pos: number): Command =>
    (state, dispatch) => {
        const node = state.doc.nodeAt(pos);
        if (node?.type !== headerImageNodeType(state.schema)) return false;
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

export const removeSelectedHeaderImage: Command = (state, dispatch, view) => {
    const selected = selectedHeaderImage(state);
    return selected !== null && removeHeaderImage(selected.pos)(state, dispatch, view);
};

const selectHeaderImageNear = selectNodeNear(headerImageNodeType, siblingBlock);

/** Backspace at the start of the block after the image selects the image. */
export const selectHeaderImageBefore = selectHeaderImageNear(-1);
/** Delete at the end of the block before the image selects the image. */
export const selectHeaderImageAfter = selectHeaderImageNear(1);
