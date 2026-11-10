import type {ToolbarDataType, ToolbarItem} from '@gravity-ui/markdown-editor';

import {insertLabel} from '../../markup/commands/insertLabel';
import {labelItemView} from '../view/items';

export const toolbarLabelItem: Omit<ToolbarItem<ToolbarDataType.SingleButton>, 'wysiwyg'> = {
    view: labelItemView,
    markup: {
        exec: (e) => insertLabel(e.cm),
        isActive: () => false,
        isEnable: () => true,
    },
};
