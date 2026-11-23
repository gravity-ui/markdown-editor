import type {ToolbarDataType, ToolbarItem} from '@gravity-ui/markdown-editor';

import {bannerItemView} from '../view/items';

export const toolbarBannerItem: Omit<ToolbarItem<ToolbarDataType.SingleButton>, 'markup'> = {
    view: bannerItemView,
    wysiwyg: {
        exec: (e) => e.actions.insertBanner.run(),
        isActive: (e) => e.actions.insertBanner.isActive(),
        isEnable: (e) => e.actions.insertBanner.isEnable(),
    },
};
