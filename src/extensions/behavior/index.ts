import type {ExtensionAuto} from '../../core';
import {isFunction} from '../../lodash';
import {PlaceholderOptions} from '../../utils/placeholder';
import {Emoji, EmojiOptions} from '../yfm/Emoji';

import {ClicksOnEdges} from './ClicksOnEdges';
import {Clipboard, ClipboardOptions} from './Clipboard';
import {CodeBlockHighlight, CodeBlockHighlightOptions} from './CodeBlockHighlight';
import {CommandMenu, CommandMenuOptions} from './CommandMenu';
import {Cursor, CursorOptions} from './Cursor';
import {FilePaste} from './FilePaste';
import {History, HistoryOptions} from './History';
import {ImgSizeAdditions, ImgSizeAdditionsOptions} from './ImgSizeAdditions';
import {LinkEnhance, LinkEnhanceOptions} from './LinkEnhance';
import {Placeholder} from './Placeholder';
import {ReactRenderer, ReactRendererExtension} from './ReactRenderer';
import {Selection} from './Selection';
import {SelectionContext, SelectionContextOptions} from './SelectionContext';
import {TableContextExtension} from './TableContext';
import {WidgetDecoration} from './WidgetDecoration';
import {YfmFileAdditions, YfmFileAdditionsOptions} from './YfmFileAdditions';
import {YfmNoteTooltip} from './YfmNoteTooltip';
import {YfmTableAdditions} from './YfmTableAdditions';

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

    link?: LinkEnhanceOptions;
    codeBlock?: CodeBlockHighlightOptions;

    imgSize?: ImgSizeAdditionsOptions;
    yfmFile?: YfmFileAdditionsOptions;

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
        .use(ReactRendererExtension, opts.reactRenderer);

    builder.use(WidgetDecoration).use(SelectionContext, opts.selectionContext ?? {});

    builder.use(TableContextExtension).use(LinkEnhance, opts.link ?? {});

    if (isFunction(opts.codeBlock)) {
        builder.use(opts.codeBlock);
    } else {
        builder.use(CodeBlockHighlight, opts.codeBlock ?? {});
    }

    builder
        .use(ImgSizeAdditions, opts.imgSize ?? {})
        // .use(YfmHeadingAdditions)
        .use(YfmNoteTooltip)
        .use(YfmFileAdditions, opts.yfmFile ?? {})
        .use(YfmTableAdditions);

    if (opts.emoji) {
        builder.use(Emoji, opts.emoji);
    }

    if (opts.commandMenu) builder.use(CommandMenu, opts.commandMenu);
    builder.use(FilePaste);
    builder.use(ClicksOnEdges);
};
