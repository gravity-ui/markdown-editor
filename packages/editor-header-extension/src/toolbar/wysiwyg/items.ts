import type {ToolbarDataType, ToolbarItem} from '@gravity-ui/markdown-editor';

import {headerItemView} from '../view/items';

export const toolbarHeaderItem: Omit<ToolbarItem<ToolbarDataType.SingleButton>, 'markup'> = {
    view: headerItemView,
    wysiwyg: {
        exec: (e) => e.actions.insertHeader.run(),
        isActive: (e) => e.actions.insertHeader.isActive(),
        isEnable: (e) => e.actions.insertHeader.isEnable(),
    },
};
