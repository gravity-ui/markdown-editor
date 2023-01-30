import type {ExtensionAuto} from '../../../core';
import {selection} from './selection';

export {createFakeParagraph, findFakeParaPosForCodeBlock} from './commands';

export const Selection: ExtensionAuto = (builder) => {
    builder.addPlugin(selection);
};
