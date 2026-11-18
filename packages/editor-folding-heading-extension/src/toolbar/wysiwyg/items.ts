import type {ToolbarDataType, ToolbarItem, ToolbarItemWysiwyg} from '@gravity-ui/markdown-editor';

import {toggleHeadingFoldingItemView} from '../view/items';

export const toggleHeadingFoldingItemWysiwyg: ToolbarItemWysiwyg = {
    isActive: (editor) => editor.actions.toggleHeadingFolding?.isActive() ?? false,
    isEnable: (editor) => editor.actions.toggleHeadingFolding?.isEnable() ?? false,
    exec: (editor) => editor.actions.toggleHeadingFolding.run(),
    condition: 'enabled',
};

export const toolbarFoldingHeadingItem: Omit<
    ToolbarItem<ToolbarDataType.SingleButton>,
    'markup'
> = {
    view: toggleHeadingFoldingItemView,
    wysiwyg: toggleHeadingFoldingItemWysiwyg,
};
