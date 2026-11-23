import type {ToolbarDataType, ToolbarItem} from '@gravity-ui/markdown-editor';

import {termItemView} from '../view/items';

export const toolbarTermItem: Omit<ToolbarItem<ToolbarDataType.SingleButton>, 'markup'> = {
    view: termItemView,
    wysiwyg: {
        exec: (editor) => editor.actions.insertTerm.run(),
        isActive: (editor) => editor.actions.insertTerm.isActive(),
        isEnable: (editor) => editor.actions.insertTerm.isEnable(),
    },
};
