import type {ToolbarDataType, ToolbarItem} from '@gravity-ui/markdown-editor';

import {insertMermaidDiagram} from '../../markup/commands/insertMermaidDiagram';
import {mermaidItemView} from '../view/items';

export const toolbarMermaidItem: Omit<ToolbarItem<ToolbarDataType.SingleButton>, 'wysiwyg'> = {
    view: mermaidItemView,
    markup: {
        exec: (e) => insertMermaidDiagram(e.cm),
        isActive: () => false,
        isEnable: () => true,
    },
};
