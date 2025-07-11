import type {ExtensionAuto} from '../../core';
import type {PlaceholderOptions} from '../../utils/placeholder';

import {ClicksOnEdges} from './ClicksOnEdges';
import {Clipboard, type ClipboardOptions} from './Clipboard';
import {CommandMenu, type CommandMenuOptions} from './CommandMenu';
import {Cursor, type CursorOptions} from './Cursor';
import {FilePaste} from './FilePaste';
import {History, type HistoryOptions} from './History';
import {Placeholder} from './Placeholder';
import {type ReactRenderer, ReactRendererExtension} from './ReactRenderer';
import {Selection} from './Selection';
import {SelectionContext, type SelectionContextOptions} from './SelectionContext';
import {SharedState} from './SharedState';
import {WidgetDecoration} from './WidgetDecoration';

export * from './Autocomplete';
export * from './ClicksOnEdges';
export * from './Clipboard';
export * from './CommandMenu';
export * from './Cursor';
export * from './FilePaste';
export * from './History';
export * from './Placeholder';
export * from './ReactRenderer';
export * from './Selection';
export * from './SelectionContext';
export * from './SharedState';
export * from './WidgetDecoration';

export type BehaviorPresetOptions = {
    cursor?: CursorOptions;
    history?: HistoryOptions;
    clipboard?: ClipboardOptions;
    placeholder?: PlaceholderOptions;
    reactRenderer: ReactRenderer;
    selectionContext?: SelectionContextOptions;

    commandMenu?: CommandMenuOptions;
};

export const BehaviorPreset: ExtensionAuto<BehaviorPresetOptions> = (builder, opts) => {
    builder
        .use(Selection)
        .use(SharedState)
        .use(Placeholder, opts.placeholder ?? {})
        .use(Cursor, opts.cursor ?? {})
        .use(History, opts.history ?? {})
        .use(Clipboard, opts.clipboard ?? {})
        .use(ReactRendererExtension, opts.reactRenderer)
        .use(WidgetDecoration)
        .use(SelectionContext, opts.selectionContext ?? {});

    if (opts.commandMenu) builder.use(CommandMenu, opts.commandMenu);
    builder.use(FilePaste);
    builder.use(ClicksOnEdges);
};
