import {memo} from 'react';

import type {ExtensionAuto} from '@gravity-ui/markdown-editor';
import {Button} from '@gravity-ui/markdown-editor/extensions/additional/Button/index.js';
import {Header} from '@gravity-ui/markdown-editor/extensions/additional/Header/index.js';

import {Playground} from '../../../components/Playground';

const markup = ':::header{height=s}\n\n:::\n\n::button[Открыть](https://gravity-ui.com)';

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
