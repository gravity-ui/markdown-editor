import type {ToolbarDataType, ToolbarItem} from '@gravity-ui/markdown-editor';

import {buttonItemView, headerItemView} from '../view/items';

export const toolbarHeaderItem: Omit<ToolbarItem<ToolbarDataType.SingleButton>, 'markup'> = {
    view: headerItemView,
    wysiwyg: {
        exec: (e) => e.actions.insertHeader.run(),
        isActive: (e) => e.actions.insertHeader.isActive(),
        isEnable: (e) => e.actions.insertHeader.isEnable(),
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
