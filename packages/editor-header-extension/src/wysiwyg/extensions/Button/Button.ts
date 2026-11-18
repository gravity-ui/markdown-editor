import type {ExtensionAuto} from '@gravity-ui/markdown-editor/core';

import {WButtonNodeView} from './ButtonNodeView';
import {ButtonSpecs, buttonNodeName} from './ButtonSpecs';
import {selectButtonAfter, selectButtonBefore} from './commands';
import {buttonSettingsPlugin} from './plugins/ButtonSettingsPlugin';

import '@gravity-ui/markdown-plugin-header/styles.css';

export const Button: ExtensionAuto = (builder) => {
    builder
        .use(ButtonSpecs)
        .addNodeView(
            buttonNodeName,
            ({markupParser}) =>
                (node, view, getPos, decorations) =>
                    new WButtonNodeView(node, view, getPos, markupParser, decorations),
        )
        .addPlugin(buttonSettingsPlugin)
        .addKeymap(
            () => ({Backspace: selectButtonBefore, Delete: selectButtonAfter}),
            builder.Priority.High,
        );
};
