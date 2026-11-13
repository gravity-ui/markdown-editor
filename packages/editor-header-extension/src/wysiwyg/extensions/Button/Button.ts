import type {Action, ExtensionAuto} from '@gravity-ui/markdown-editor/core';

import {WButtonNodeView} from './ButtonNodeView';
import {ButtonSpecs, buttonNodeName} from './ButtonSpecs';
import {insertButton} from './commands';
import {insertButtonAction} from './const';
import {buttonSettingsPlugin} from './plugins/ButtonSettingsPlugin';

import '@gravity-ui/markdown-plugin-header/styles.css';

export const Button: ExtensionAuto = (builder) => {
    builder
        .use(ButtonSpecs)
        .addNodeView(buttonNodeName, () => (node) => new WButtonNodeView(node))
        .addPlugin(buttonSettingsPlugin)
        .addAction(insertButtonAction, () => ({isEnable: insertButton, run: insertButton}));
};

declare global {
    namespace WysiwygEditor {
        interface Actions {
            [insertButtonAction]: Action;
        }
    }
}
