import type {ExtensionAuto} from '../../../core';
import {selection} from './selection';

export {
    createFakeParagraph,
    findFakeParaPosForNodeSelection,
    findFakeParaPosForTextSelection,
    findFakeParaPosForCodeBlock,
    findFakeParaPosClosestToPos,
} from './commands';

export type {Direction as SelectionDirection} from './commands';

export const Selection: ExtensionAuto = (builder) => {
    builder.addPlugin(selection);
};
