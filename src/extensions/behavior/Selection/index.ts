import type {ExtensionAuto} from '../../../core';
import {selection} from './selection';

export const Selection: ExtensionAuto = (builder) => {
    builder.addPlugin(selection);
};
