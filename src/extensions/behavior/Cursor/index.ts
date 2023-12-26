import {dropCursor} from 'prosemirror-dropcursor';

import type {ExtensionAuto} from '../../../core';

import {gapCursor} from './gapcursor';

export {GapCursorSelection, isGapCursorSelection} from './GapCursorSelection';

export type CursorOptions = {
    dropOptions?: Parameters<typeof dropCursor>[0];
};

export const Cursor: ExtensionAuto<CursorOptions> = (builder, opts) => {
    builder.addPlugin(() => gapCursor());
    builder.addPlugin(() => dropCursor(opts.dropOptions));
};
