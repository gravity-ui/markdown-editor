import type {Action, ExtensionAuto} from '#core';

import {ButtonSpecs} from './ButtonSpecs';
import {addButton, buttonAction} from './actions';
import {buttonSettingsPlugin} from './plugins/ButtonSettings';

import './index.scss';

export * from './ButtonSpecs';
export {buttonAction} from './actions';
export {buttonItemMarkup, buttonItemView, buttonItemWysiwyg} from './toolbar';

export const Button: ExtensionAuto = (builder) => {
    builder
        .use(ButtonSpecs)
        .addPlugin(buttonSettingsPlugin)
        .addAction(buttonAction, () => addButton);
};

declare global {
    namespace WysiwygEditor {
        interface Actions {
            [buttonAction]: Action;
        }
    }
}
