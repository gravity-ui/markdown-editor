import type {ToolbarDataType, ToolbarItem} from '@gravity-ui/markdown-editor';

import {insertButton} from '../../markup/commands/insertButton';
import {insertHeader} from '../../markup/commands/insertHeader';
import {buttonItemView, headerItemView} from '../view/items';

export const toolbarHeaderItem: Omit<ToolbarItem<ToolbarDataType.SingleButton>, 'wysiwyg'> = {
    view: headerItemView,
    markup: {
        exec: (e) => insertHeader(e.cm),
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
