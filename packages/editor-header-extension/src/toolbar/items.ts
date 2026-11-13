import type {ToolbarDataType, ToolbarItem} from '@gravity-ui/markdown-editor';

import {
    toolbarButtonItem as markupButtonItem,
    toolbarHeaderItem as markupItem,
} from './markup/items';
import {
    toolbarButtonItem as wysiwygButtonItem,
    toolbarHeaderItem as wysiwygItem,
} from './wysiwyg/items';

export const toolbarHeaderItem: ToolbarItem<ToolbarDataType.SingleButton> = {
    ...wysiwygItem,
    ...markupItem,
};

export const toolbarButtonItem: ToolbarItem<ToolbarDataType.SingleButton> = {
    ...wysiwygButtonItem,
    ...markupButtonItem,
};
