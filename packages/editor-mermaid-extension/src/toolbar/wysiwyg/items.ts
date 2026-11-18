import type {ToolbarDataType, ToolbarItem} from '@gravity-ui/markdown-editor';

import {mermaidItemView} from '../view/items';

export const toolbarMermaidItem: Omit<ToolbarItem<ToolbarDataType.SingleButton>, 'markup'> = {
    view: mermaidItemView,
    wysiwyg: {
        exec: (e) => e.actions.createMermaid.run(),
        isActive: (e) => e.actions.createMermaid.isActive(),
        isEnable: (e) => e.actions.createMermaid.isEnable(),
    },
};
