import type {ExtensionAuto} from '../../../core';
import {selection} from './selection';

export * as SelectionCommands from './commands';

export const Selection: ExtensionAuto = (builder) => {
    builder.addPlugin(selection);
};
