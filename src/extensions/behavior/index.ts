import type {ExtensionAuto} from '../../core';

import {Selection} from './Selection';
import {Placeholder} from './Placeholder';
import {Cursor, CursorOptions} from './Cursor';
import {History, HistoryOptions} from './History';
import {Clipboard, ClipboardOptions} from './Clipboard';

export * from './Cursor';
export * from './History';
export * from './Clipboard';
export * from './Selection';
export * from './Placeholder';

export type BehaviorPresetOptions = {
    cursor?: CursorOptions;
    history?: HistoryOptions;
    clipboard?: ClipboardOptions;
};

export const BehaviorPreset: ExtensionAuto<BehaviorPresetOptions> = (builder, opts) => {
    builder
        .use(Selection)
        .use(Placeholder)
        .use(Cursor, opts.cursor ?? {})
        .use(History, opts.history ?? {})
        .use(Clipboard, opts.clipboard ?? {});
};
