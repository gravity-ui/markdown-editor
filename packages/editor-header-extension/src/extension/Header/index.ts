import type {Action, ExtensionAuto} from '@gravity-ui/markdown-editor/core';

import {HeaderSpecs, headerNodeName} from './HeaderSpecs';
import {headerSettingsPlugin} from './Settings';
import {insertHeader} from './commands';
import {headerNodeView} from './node-view';

import '@gravity-ui/markdown-plugin-header/styles.css';

export const Header: ExtensionAuto = (builder) => {
    builder
        .use(HeaderSpecs)
        .addNodeView(headerNodeName, () => headerNodeView)
        .addAction('insertHeader', () => ({isEnable: insertHeader, run: insertHeader}))
        .addPlugin(headerSettingsPlugin);
};

declare global {
    namespace WysiwygEditor {
        interface Actions {
            insertHeader: Action;
        }
    }
}
