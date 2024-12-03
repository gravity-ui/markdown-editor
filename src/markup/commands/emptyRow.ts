import {StateCommand} from '@codemirror/state';

import {replaceOrInsertAfter} from './helpers';

export const insertEmptyRow: StateCommand = ({state, dispatch}) => {
    const emptyRowMarkup = '&nbsp;';
    const tr = replaceOrInsertAfter(state, emptyRowMarkup, true);
    dispatch(state.update(tr));
    return true;
};
