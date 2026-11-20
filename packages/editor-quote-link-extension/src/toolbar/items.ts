import type {ToolbarDataType, ToolbarItem} from '@gravity-ui/markdown-editor';

import {toolbarQuoteLinkItem as markupItem} from './markup/items';
import {toolbarQuoteLinkItem as wysiwygItem} from './wysiwyg/items';

export const toolbarQuoteLinkItem: ToolbarItem<ToolbarDataType.SingleButton> = {
    ...wysiwygItem,
    ...markupItem,
};
