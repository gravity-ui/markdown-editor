import {MarkupHelpers} from '@gravity-ui/markdown-editor';
import type {StateCommand} from '@gravity-ui/markdown-editor/cm/state';

export const insertHeaderMarkup: StateCommand = ({state, dispatch}) => {
    const tr = MarkupHelpers.replaceOrInsertAfter(state, ':::header{height="s" width="m"}\n:::');
    dispatch(state.update(tr));
    return true;
};
