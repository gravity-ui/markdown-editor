import type {Action, ExtensionAuto} from '@gravity-ui/markdown-editor/core';

import {headerSettingsPlugin} from './Settings';
import {insertHeader} from './commands';
import {headerNodeName} from './const';
import {headerNodeView} from './node-view';
import {HeaderSpecs} from './specs';

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
