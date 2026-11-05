import {SquareDashed} from '@gravity-ui/icons';
import {ToolbarDataType, type ToolbarsPreset} from '@gravity-ui/markdown-editor';

import {i18n} from './i18n';
import {insertHeaderMarkup} from './markup/commands';

export const headerItem: ToolbarsPreset['items'][string] = {
    view: {
        type: ToolbarDataType.SingleButton,
        icon: {data: SquareDashed},
        title: () => i18n('insert'),
    },
    wysiwyg: {
        exec: (editor) => editor.actions.insertHeader.run(),
        isEnable: (editor) => editor.actions.insertHeader.isEnable(),
        isActive: () => false,
    },
    markup: {
        exec: ({cm}) => insertHeaderMarkup(cm),
        isEnable: () => true,
        isActive: () => false,
    },
};
