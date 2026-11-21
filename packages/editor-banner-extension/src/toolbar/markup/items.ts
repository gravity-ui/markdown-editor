import type {ToolbarDataType, ToolbarItem} from '@gravity-ui/markdown-editor';

import {insertBanner} from '../../markup/commands/insertBanner';
import {bannerItemView} from '../view/items';

export const toolbarBannerItem: Omit<ToolbarItem<ToolbarDataType.SingleButton>, 'wysiwyg'> = {
    view: bannerItemView,
    markup: {
        exec: (e) => insertBanner(e.cm),
        isActive: () => false,
        isEnable: () => true,
    },
};
