import type {ToolbarDataType, ToolbarItem} from '@gravity-ui/markdown-editor';

import {
    toolbarButtonItem as markupButtonItem,
    toolbarBannerItem as markupItem,
} from './markup/items';
import {
    toolbarButtonItem as wysiwygButtonItem,
    toolbarBannerItem as wysiwygItem,
} from './wysiwyg/items';

export const toolbarBannerItem: ToolbarItem<ToolbarDataType.SingleButton> = {
    ...wysiwygItem,
    ...markupItem,
};

export const toolbarButtonItem: ToolbarItem<ToolbarDataType.SingleButton> = {
    ...wysiwygButtonItem,
    ...markupButtonItem,
};
