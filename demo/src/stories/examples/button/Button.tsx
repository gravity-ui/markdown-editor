import {memo} from 'react';

import type {ExtensionAuto} from '@gravity-ui/markdown-editor';
import {Button} from '@gravity-ui/markdown-editor/extensions/additional/Button/index.js';
import {Header} from '@gravity-ui/markdown-editor/extensions/additional/Header/index.js';

import {Playground} from '../../../components/Playground';

const markup = [
    ':::header{height=s}\n\n:::',
    '::button[Акцентная](https://gravity-ui.com)',
    '::button[Зелёная](https://gravity-ui.com){color=green}',
    '::button[Второстепенная](https://gravity-ui.com){view=normal color=blue}',
    '::button[С обводкой](https://gravity-ui.com){view=outlined color=red}',
    '::button[Без фона](https://gravity-ui.com){view=flat color=violet}',
].join('\n\n');

const extensions: ExtensionAuto = (builder) => builder.use(Header).use(Button);

export const ButtonEditor = memo(function ButtonEditor() {
    return (
        <Playground
            initial={markup}
            initialEditor="wysiwyg"
            initialSplitModeEnabled
            splitModeOrientation="horizontal"
            renderPreviewDefined
            settingsVisible
            wysiwygConfig={{extensions}}
        />
    );
});
