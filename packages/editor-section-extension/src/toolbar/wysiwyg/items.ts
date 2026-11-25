import type {ToolbarDataType, ToolbarItem} from '@gravity-ui/markdown-editor';

import {sectionItemView} from '../view/items';

export const toolbarSectionItem: Omit<ToolbarItem<ToolbarDataType.SingleButton>, 'markup'> = {
    view: sectionItemView,
    wysiwyg: {
        exec: (editor) => editor.actions.insertSection.run(),
        isActive: (editor) => editor.actions.insertSection.isActive(),
        isEnable: (editor) => editor.actions.insertSection.isEnable(),
    },
};
