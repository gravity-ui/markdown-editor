import {MarkupHelpers} from '@gravity-ui/markdown-editor';
import type {StateCommand} from '@gravity-ui/markdown-editor/cm/state';
import {bannerDefaults, buttonDefaults} from '@gravity-ui/markdown-plugin-banner';

import {i18n} from '../../i18n';

export const insertBanner: StateCommand = ({state, dispatch}) => {
    const tr = MarkupHelpers.replaceOrInsertAfter(
        state,
        [
            `:::banner{height="${bannerDefaults.height}" width="${bannerDefaults.width}"}`,
            `::banner-title[${i18n('preview-title')}]`,
            `:::banner-content\n${i18n('preview-description')}\n:::`,
            `:button[${i18n('button-placeholder')}]{view="${buttonDefaults.view}" color="${buttonDefaults.color}"}`,
        ]
            .join('\n\n')
            .concat('\n:::'),
    );
    dispatch(state.update(tr));
    return true;
};
