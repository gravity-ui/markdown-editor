import {MarkupHelpers} from '@gravity-ui/markdown-editor';
import type {StateCommand} from '@gravity-ui/markdown-editor/cm/state';
import {bannerDefaults} from '@gravity-ui/markdown-plugin-banner';

import {i18n} from '../../i18n';
import {bannerButtonStyles} from '../../wysiwyg/extensions/Banner/const';

export const insertBanner: StateCommand = ({state, dispatch}) => {
    const {view, color} = bannerButtonStyles[0];
    const tr = MarkupHelpers.replaceOrInsertAfter(
        state,
        [
            `:::banner{height="${bannerDefaults.height}" width="${bannerDefaults.width}"}`,
            `::banner-title[${i18n('title-placeholder')}]`,
            `:::banner-content\n${i18n('content-placeholder')}\n:::`,
            `:button[${i18n('button-placeholder')}]{view="${view}" color="${color}"}`,
        ]
            .join('\n\n')
            .concat('\n:::'),
    );
    dispatch(state.update(tr));
    return true;
};
