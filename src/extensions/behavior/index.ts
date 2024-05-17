import type {ExtensionAuto} from '../../core';
import {PlaceholderOptions} from '../../utils/placeholder';
import {Emoji, EmojiOptions} from '../yfm/Emoji';

import {ClicksOnEdges} from './ClicksOnEdges';
import {Clipboard, ClipboardOptions} from './Clipboard';
import {CommandMenu, CommandMenuOptions} from './CommandMenu';
import {Cursor, CursorOptions} from './Cursor';
import {FilePaste} from './FilePaste';
import {History, HistoryOptions} from './History';
import {Placeholder} from './Placeholder';
import {ReactRenderer, ReactRendererExtension} from './ReactRenderer';
import {Selection} from './Selection';
import {SelectionContext, SelectionContextOptions} from './SelectionContext';
import {WidgetDecoration} from './WidgetDecoration';

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
    selectionContext?: SelectionContextOptions;

    commandMenu?: CommandMenuOptions;

    emoji?: EmojiOptions;
};

export const BehaviorPreset: ExtensionAuto<BehaviorPresetOptions> = (builder, opts) => {
    builder
        .use(Selection)
        .use(Placeholder, opts.placeholder ?? {})
        .use(Cursor, opts.cursor ?? {})
        .use(History, opts.history ?? {})
        .use(Clipboard, opts.clipboard ?? {})
        .use(ReactRendererExtension, opts.reactRenderer)
        .use(WidgetDecoration)
        .use(SelectionContext, opts.selectionContext ?? {})

    if (opts.emoji) {
        builder.use(Emoji, opts.emoji);
    }

    if (opts.commandMenu) builder.use(CommandMenu, opts.commandMenu);
    builder.use(FilePaste);
    builder.use(ClicksOnEdges);
};
