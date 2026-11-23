import type {ToolbarDataType, ToolbarItem} from '@gravity-ui/markdown-editor';

import {toolbarBannerItem as markupItem} from './markup/items';
import {toolbarBannerItem as wysiwygItem} from './wysiwyg/items';

export const toolbarBannerItem: ToolbarItem<ToolbarDataType.SingleButton> = {
    ...wysiwygItem,
    ...markupItem,
};
