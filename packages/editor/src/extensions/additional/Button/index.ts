import type {ExtensionAuto} from '#core';

import {ButtonSpecs} from './ButtonSpecs';
import {buttonSettingsPlugin} from './plugins/ButtonSettings';

import './index.scss';

export * from './ButtonSpecs';

export const Button: ExtensionAuto = (builder) => {
    builder.use(ButtonSpecs).addPlugin(buttonSettingsPlugin);
};
