import type {ExtensionAuto} from '#core';

import {ButtonSpecs} from './ButtonSpecs';

import './index.scss';

export * from './ButtonSpecs';

export const Button: ExtensionAuto = (builder) => {
    builder.use(ButtonSpecs);
};
