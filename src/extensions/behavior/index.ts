import type {ExtensionAuto} from '../../core';

import {Selection} from './Selection';
import {Placeholder} from './Placeholder';
import {Cursor, CursorOptions} from './Cursor';
import {History, HistoryOptions} from './History';
import {Clipboard, ClipboardOptions} from './Clipboard';
import {ReactRendererExtension, ReactRenderer} from './ReactRenderer';
import {PlaceholderOptions} from '../../utils/placeholder';

export * from './Cursor';
export * from './History';
export * from './Clipboard';
export * from './Selection';
export * from './Placeholder';
export * from './ReactRenderer';

export type BehaviorPresetOptions = {
    cursor?: CursorOptions;
    history?: HistoryOptions;
    clipboard?: ClipboardOptions;
    placeholder?: PlaceholderOptions;
    reactRenderer: ReactRenderer;
};

export const BehaviorPreset: ExtensionAuto<BehaviorPresetOptions> = (builder, opts) => {
    builder
        .use(Selection)
        .use(Placeholder, opts.placeholder ?? {})
        .use(Cursor, opts.cursor ?? {})
        .use(History, opts.history ?? {})
        .use(Clipboard, opts.clipboard ?? {})
        .use(ReactRendererExtension, opts.reactRenderer);
};
