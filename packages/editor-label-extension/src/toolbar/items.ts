import type {ToolbarDataType, ToolbarItem} from '@gravity-ui/markdown-editor';

import {toolbarLabelItem as markupItem} from './markup/items';
import {toolbarLabelItem as wysiwygItem} from './wysiwyg/items';

export const toolbarLabelItem: ToolbarItem<ToolbarDataType.SingleButton> = {
    ...wysiwygItem,
    ...markupItem,
};
