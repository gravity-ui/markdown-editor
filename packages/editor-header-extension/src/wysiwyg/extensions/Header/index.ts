import type {Action, ExtensionAuto} from '@gravity-ui/markdown-editor/core';

import {WHeaderNodeView} from './HeaderNodeView';
import {headerKeymap} from './HeaderNodeView/keymap';
import {HeaderSpecs, headerNodeName} from './HeaderSpecs';
import {insertHeader} from './commands';
import {insertHeaderAction} from './const';

import '@gravity-ui/markdown-plugin-header/styles.css';

export const Header: ExtensionAuto = (builder) => {
    builder
        .use(HeaderSpecs)
        .addNodeView(
            headerNodeName,
            () => (node, view, getPos) => new WHeaderNodeView(node, view, getPos),
        )
        .addAction(insertHeaderAction, () => ({isEnable: insertHeader, run: insertHeader}))
        // Blocks inside the header handle Tab first.
        .addKeymap(headerKeymap, builder.Priority.Low);
};

declare global {
    namespace WysiwygEditor {
        interface Actions {
            [insertHeaderAction]: Action;
        }
    }
}
