import type {Action, ExtensionAuto} from '@gravity-ui/markdown-editor/core';

import {WHeaderNodeView} from './HeaderNodeView';
import {HeaderSpecs, headerNodeName} from './HeaderSpecs';
import {headerSettingsPlugin} from './Settings';
import {insertHeader} from './commands';

import '@gravity-ui/markdown-plugin-header/styles.css';

export const Header: ExtensionAuto = (builder) => {
    builder
        .use(HeaderSpecs)
        .addNodeView(
            headerNodeName,
            () => (node, view, getPos) => new WHeaderNodeView(node, view, getPos),
        )
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
