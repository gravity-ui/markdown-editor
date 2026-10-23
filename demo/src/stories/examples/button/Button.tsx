import {memo} from 'react';

import type {ExtensionAuto, ToolbarsPreset} from '@gravity-ui/markdown-editor';
import {
    Button,
    buttonAction,
    buttonItemMarkup,
    buttonItemView,
    buttonItemWysiwyg,
} from '@gravity-ui/markdown-editor/extensions/additional/Button/index.js';
import {Header} from '@gravity-ui/markdown-editor/extensions/additional/Header/index.js';
import {ToolbarName as Toolbar} from '@gravity-ui/markdown-editor/toolbars';

import {Playground} from '../../../components/Playground';
import {playgroundToolbarsPreset as base} from '../../../defaults/toolbars';

const markup = [
    ':::header{height=s}\n\n:::',
    '::button[Акцентная](https://gravity-ui.com)',
    '::button[Зелёная](https://gravity-ui.com){color=green}',
    '::button[Второстепенная](https://gravity-ui.com){view=normal color=blue}',
    '::button[С обводкой](https://gravity-ui.com){view=outlined color=red}',
    '::button[Без фона](https://gravity-ui.com){view=flat color=violet}',
].join('\n\n');

const extensions: ExtensionAuto = (builder) => builder.use(Header).use(Button);

const toolbarsPreset: ToolbarsPreset = {
    items: {
        ...base.items,
        [buttonAction]: {
            view: buttonItemView,
            wysiwyg: buttonItemWysiwyg,
            markup: buttonItemMarkup,
        },
    },
    orders: {
        ...base.orders,
        [Toolbar.wysiwygMain]: [[buttonAction], ...base.orders[Toolbar.wysiwygMain]],
        [Toolbar.markupMain]: [[buttonAction], ...base.orders[Toolbar.markupMain]],
        [Toolbar.wysiwygSlash]: [[buttonAction, ...base.orders[Toolbar.wysiwygSlash].flat()]],
    },
};

export const ButtonEditor = memo(function ButtonEditor() {
    return (
        <Playground
            initial={markup}
            initialEditor="wysiwyg"
            initialSplitModeEnabled
            splitModeOrientation="horizontal"
            renderPreviewDefined
            settingsVisible
            toolbarsPreset={toolbarsPreset}
            wysiwygConfig={{extensions}}
        />
    );
});
