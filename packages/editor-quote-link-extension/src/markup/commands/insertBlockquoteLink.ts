import {MarkupHelpers} from '@gravity-ui/markdown-editor';
import type {StateCommand} from '@gravity-ui/markdown-editor/cm/state';

export const insertBlockquoteLink: StateCommand = ({state, dispatch}) => {
    const markup = '> [link](url "title"){data-quotelink=true}\n> \n> ';
    const tr = MarkupHelpers.replaceOrInsertAfter(state, markup);
    dispatch(state.update(tr));
    return true;
};
