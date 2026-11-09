import type {Action, ExtensionAuto} from '@gravity-ui/markdown-editor/core';

import {WHeaderNodeView} from './HeaderNodeView';
import {headerKeymap} from './HeaderNodeView/keymap';
import {HeaderSpecs, headerNodeName} from './HeaderSpecs';
import {headerSettingsPlugin} from './Settings';
import {insertHeader} from './commands';
import {insertHeaderAction} from './const';
import {headerTitleKeymap} from './text/commands';

import '@gravity-ui/markdown-plugin-header/styles.css';

export const Header: ExtensionAuto = (builder) => {
    builder
        .use(HeaderSpecs)
        .addNodeView(
            headerNodeName,
            () => (node, view, getPos) => new WHeaderNodeView(node, view, getPos),
        )
        .addAction(insertHeaderAction, () => ({isEnable: insertHeader, run: insertHeader}))
        .addPlugin(headerSettingsPlugin)
        .addKeymap(headerKeymap)
        .addKeymap(headerTitleKeymap, builder.Priority.High);
};

declare global {
    namespace WysiwygEditor {
        interface Actions {
            [insertHeaderAction]: Action;
        }
    }
}
