import {MarkupHelpers} from '@gravity-ui/markdown-editor';
import type {StateCommand} from '@gravity-ui/markdown-editor/cm/state';
import {bannerDefaults} from '@gravity-ui/markdown-plugin-banner';

export const insertBanner: StateCommand = ({state, dispatch}) => {
    const tr = MarkupHelpers.replaceOrInsertAfter(
        state,
        `:::banner{height="${bannerDefaults.height}" width="${bannerDefaults.width}"}\n\n:::`,
    );
    dispatch(state.update(tr));
    return true;
};
