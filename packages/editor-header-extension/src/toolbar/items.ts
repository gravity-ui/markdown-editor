import type {ToolbarDataType, ToolbarItem} from '@gravity-ui/markdown-editor';

import {toolbarHeaderItem as markupItem} from './markup/items';
import {toolbarHeaderItem as wysiwygItem} from './wysiwyg/items';

export const toolbarHeaderItem: ToolbarItem<ToolbarDataType.SingleButton> = {
    ...wysiwygItem,
    ...markupItem,
};
