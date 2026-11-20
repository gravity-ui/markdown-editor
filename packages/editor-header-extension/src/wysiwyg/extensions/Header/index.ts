import type {Action, ExtensionAuto} from '@gravity-ui/markdown-editor/core';

import {HeaderTitle} from '../HeaderTitle';

import {WHeaderNodeView} from './HeaderNodeView';
import {HeaderSpecs, headerNodeName} from './HeaderSpecs';
import {insertHeader} from './commands';
import {insertHeaderAction} from './const';
import {headerPastePlugin, headerTitlePastePlugin} from './plugins/HeaderPastePlugin';
import {headerKeymap, headerTooltipPlugin} from './plugins/HeaderTooltipPlugin';

import '@gravity-ui/markdown-plugin-header/styles.css';

export const Header: ExtensionAuto = (builder) => {
    builder
        .use(HeaderSpecs)
        .use(HeaderTitle)
        .addNodeView(headerNodeName, () => (node) => new WHeaderNodeView(node))
        .addPlugin(headerTooltipPlugin)
        .addPlugin(headerPastePlugin, builder.Priority.High)
        .addPlugin(headerTitlePastePlugin, builder.Priority.VeryHigh)
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
