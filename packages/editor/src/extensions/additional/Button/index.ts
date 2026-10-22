import type {ExtensionAuto} from '#core';

import {ButtonSpecs} from './ButtonSpecs';
import {buttonToolbarPlugin} from './plugins/ButtonToolbar';

import './index.scss';

export * from './ButtonSpecs';

export const Button: ExtensionAuto = (builder) => {
    builder.use(ButtonSpecs).addPlugin(buttonToolbarPlugin);
};
