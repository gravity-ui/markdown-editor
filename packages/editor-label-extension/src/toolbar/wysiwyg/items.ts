import type {ToolbarDataType, ToolbarItem} from '@gravity-ui/markdown-editor';

import {labelItemView} from '../view/items';

export const toolbarLabelItem: Omit<ToolbarItem<ToolbarDataType.SingleButton>, 'markup'> = {
    view: labelItemView,
    wysiwyg: {
        exec: (e) => e.actions.addLabel.run(),
        isActive: (e) => e.actions.addLabel.isActive(),
        isEnable: (e) => e.actions.addLabel.isEnable(),
    },
};
