import {MarkupHelpers} from '@gravity-ui/markdown-editor';
import type {StateCommand} from '@gravity-ui/markdown-editor/cm/state';
import {headerDefaults} from '@gravity-ui/markdown-plugin-header';

export const insertHeader: StateCommand = ({state, dispatch}) => {
    const tr = MarkupHelpers.replaceOrInsertAfter(
        state,
        `:::header{height="${headerDefaults.height}" width="${headerDefaults.width}"}\n\n:::`,
    );
    dispatch(state.update(tr));
    return true;
};
