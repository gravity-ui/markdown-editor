import {findSelectedNodeOfType} from '@gravity-ui/markdown-editor';
import {closeHistory} from '@gravity-ui/markdown-editor/pm/history';
import {type Command, type EditorState, Selection} from '@gravity-ui/markdown-editor/pm/state';
import {headerImage, headerImageDefaults, safeImageUrl} from '@gravity-ui/markdown-plugin-header';

import {removeChild, selectNodeNear, setNodeAttrs, siblingBlock} from '../commands';

import {headerImageNodeType} from './HeaderImageSpecs';

export const selectedHeaderImage = (state: EditorState) =>
    findSelectedNodeOfType(headerImageNodeType(state.schema))(state.selection) ?? null;

export const setHeaderImageAttrs = setNodeAttrs(headerImageNodeType, headerImage, {
    accept: ({src}) => typeof src !== 'string' || safeImageUrl(src) !== null,
    history: true,
});

export const resetHeaderImage = (pos: number) => setHeaderImageAttrs(pos, headerImageDefaults);

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

export const selectHeaderImageBefore = selectHeaderImageNear(-1);
export const selectHeaderImageAfter = selectHeaderImageNear(1);
