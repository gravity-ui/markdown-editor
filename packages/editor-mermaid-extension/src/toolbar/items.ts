import type {ToolbarDataType, ToolbarItem} from '@gravity-ui/markdown-editor';

import {toolbarMermaidItem as markupItem} from './markup/items';
import {toolbarMermaidItem as wysiwygItem} from './wysiwyg/items';

export const toolbarMermaidItem: ToolbarItem<ToolbarDataType.SingleButton> = {
    ...wysiwygItem,
    ...markupItem,
};
