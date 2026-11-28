import type {ToolbarDataType, ToolbarItem} from '@gravity-ui/markdown-editor';

import {insertBanner} from '../../markup/commands/insertBanner';
import {insertButton} from '../../markup/commands/insertButton';
import {bannerItemView, buttonItemView} from '../view/items';

export const toolbarBannerItem: Omit<ToolbarItem<ToolbarDataType.SingleButton>, 'wysiwyg'> = {
    view: bannerItemView,
    markup: {
        exec: (e) => insertBanner(e.cm),
        isActive: () => false,
        isEnable: () => true,
    },
};

export const toolbarButtonItem: Omit<ToolbarItem<ToolbarDataType.SingleButton>, 'wysiwyg'> = {
    view: buttonItemView,
    markup: {
        exec: (e) => insertButton(e.cm),
        isActive: () => false,
        isEnable: () => true,
    },
};
