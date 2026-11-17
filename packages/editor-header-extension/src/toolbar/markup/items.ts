import type {ToolbarDataType, ToolbarItem} from '@gravity-ui/markdown-editor';

import {insertHeader} from '../../markup/commands/insertHeader';
import {headerItemView} from '../view/items';

export const toolbarHeaderItem: Omit<ToolbarItem<ToolbarDataType.SingleButton>, 'wysiwyg'> = {
    view: headerItemView,
    markup: {
        exec: (e) => insertHeader(e.cm),
        isActive: () => false,
        isEnable: () => true,
    },
};
