import type {ToolbarDataType, ToolbarItem} from '@gravity-ui/markdown-editor';

import {bannerItemView, buttonItemView} from '../view/items';

export const toolbarBannerItem: Omit<ToolbarItem<ToolbarDataType.SingleButton>, 'markup'> = {
    view: bannerItemView,
    wysiwyg: {
        exec: (e) => e.actions.insertBanner.run(),
        isActive: (e) => e.actions.insertBanner.isActive(),
        isEnable: (e) => e.actions.insertBanner.isEnable(),
    },
};

export const toolbarButtonItem: Omit<ToolbarItem<ToolbarDataType.SingleButton>, 'markup'> = {
    view: buttonItemView,
    wysiwyg: {
        exec: (e) => e.actions.insertButton.run(),
        isActive: (e) => e.actions.insertButton.isActive(),
        isEnable: (e) => e.actions.insertButton.isEnable(),
    },
};
