import {MarkupHelpers} from '@gravity-ui/markdown-editor';
import type {StateCommand} from '@gravity-ui/markdown-editor/cm/state';
import {headerDefaults, serializeHeader} from '@gravity-ui/markdown-plugin-header';

export const insertHeaderMarkup: StateCommand = ({state, dispatch}) => {
    const tr = MarkupHelpers.replaceOrInsertAfter(state, serializeHeader(headerDefaults));
    dispatch(state.update(tr));
    return true;
};
