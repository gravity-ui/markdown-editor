import type {ExtensionAuto} from '../../../core';
import {selection} from './selection';
import * as SelectionCommands from './commands';

export {SelectionCommands};

export const Selection: ExtensionAuto = (builder) => {
    builder.addPlugin(selection);
};
