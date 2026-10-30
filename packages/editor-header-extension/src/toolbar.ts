import {SquareDashed} from '@gravity-ui/icons';
import {ToolbarDataType, type ToolbarsPreset} from '@gravity-ui/markdown-editor';
import {replaceOrInsertAfter} from '@gravity-ui/markdown-editor/_/markup/commands/helpers.js';
import {headerDefaults, serializeHeader} from '@gravity-ui/markdown-plugin-header';

import {i18n} from './i18n';

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
        exec: ({cm}) =>
            cm.dispatch(replaceOrInsertAfter(cm.state, serializeHeader(headerDefaults))),
        isEnable: ({cm}) => !cm.state.readOnly,
        isActive: () => false,
    },
};
