import type {ExtensionAuto} from '../../core';
import {PlaceholderOptions} from '../../utils/placeholder';

import {Clipboard, ClipboardOptions} from './Clipboard';
import {Cursor, CursorOptions} from './Cursor';
import {History, HistoryOptions} from './History';
import {Placeholder} from './Placeholder';
import {ReactRenderer, ReactRendererExtension} from './ReactRenderer';
import {Selection} from './Selection';

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
