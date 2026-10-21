import {memo} from 'react';

import type {ExtensionAuto} from '@gravity-ui/markdown-editor';
import {Header} from '@gravity-ui/markdown-editor/extensions/additional/Header/index.js';

import {Playground} from '../../../components/Playground';

const markup = ['s', 'm', 'l'].map((height) => `:::header{height=${height}}\n\n:::`).join('\n\n');

const extensions: ExtensionAuto = (builder) => builder.use(Header);

export const HeaderEditor = memo(function HeaderEditor() {
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
