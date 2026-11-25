import type {Action, ExtensionAuto} from '@gravity-ui/markdown-editor/core';

import {WButtonNodeView} from './ButtonNodeView';
import {ButtonSpecs, buttonNodeName} from './ButtonSpecs';
import {insertButton, selectButtonAfter, selectButtonBefore, selectedButton} from './commands';
import {insertButtonAction} from './const';
import {buttonMarksPlugin} from './plugins/ButtonMarksPlugin';
import {buttonRowPlugin} from './plugins/ButtonRowPlugin';
import {buttonSettingsPlugin} from './plugins/ButtonSettingsPlugin';

import '@gravity-ui/markdown-plugin-banner/styles.css';

export const Button: ExtensionAuto = (builder) => {
    builder
        .use(ButtonSpecs)
        .addNodeView(
            buttonNodeName,
            ({markupParser}) =>
                (node, view, getPos, decorations) =>
                    new WButtonNodeView(node, view, getPos, markupParser, decorations),
        )
        .addPlugin(buttonRowPlugin)
        .addPlugin(buttonMarksPlugin)
        .addPlugin(buttonSettingsPlugin)
        .addKeymap(
            () => ({Backspace: selectButtonBefore, Delete: selectButtonAfter}),
            builder.Priority.High,
        )
        .addAction(insertButtonAction, () => ({
            isActive: (state) => Boolean(selectedButton(state)),
            isEnable: insertButton,
            run: insertButton,
        }));
};

declare global {
    namespace WysiwygEditor {
        interface Actions {
            [insertButtonAction]: Action;
        }
    }
}
