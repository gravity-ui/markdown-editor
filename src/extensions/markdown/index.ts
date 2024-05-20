import type {Extension, ExtensionAuto} from '../../core';
import {isFunction} from '../../lodash';

import {Blockquote, BlockquoteOptions} from './Blockquote';
import {Bold, BoldOptions} from './Bold';
import {Breaks, BreaksOptions} from './Breaks';
import {Code, CodeOptions} from './Code';
import {CodeBlock, CodeBlockOptions} from './CodeBlock';
import {Deflist, DeflistOptions} from './Deflist';
import {Heading, HeadingOptions} from './Heading';
import {HorizontalRule} from './HorizontalRule';
import {Html} from './Html';
import {Image} from './Image';
import {Italic, ItalicOptions} from './Italic';
import {Link, LinkOptions} from './Link';
import {Lists, ListsOptions} from './Lists';
import {Mark} from './Mark';
import {Strike, StrikeOptions} from './Strike';
import {Subscript} from './Subscript';
import {Superscript} from './Superscript';
import {Table} from './Table';
import {Underline, UnderlineOptions} from './Underline';

export * from './Bold';
export * from './Code';
export * from './Link';
export * from './Italic';
export * from './Strike';
export * from './Underline';
export * from './Mark';
export * from './Subscript';
export * from './Superscript';

export * from './Html';
export * from './Breaks';
export * from './Blockquote';
export * from './CodeBlock';
export * from './Deflist';
export * from './Lists';
export * from './Image';
export * from './Table';
export * from './Heading';
export * from './HorizontalRule';

export type MarkdownMarksPresetOptions = {
    bold?: BoldOptions;
    italic?: ItalicOptions;
    strike?: StrikeOptions;
    underline?: UnderlineOptions;
    code?: CodeOptions;
    link?: LinkOptions;
};

export const MarkdownMarksPreset: ExtensionAuto<MarkdownMarksPresetOptions> = (builder, opts) => {
    builder
        .use(Bold, opts.bold ?? {})
        .use(Code, opts.code ?? {})
        .use(Italic, opts.italic ?? {})
        .use(Strike, opts.strike ?? {})
        .use(Underline, opts.underline ?? {})
        .use(Link, opts.link ?? {})
        .use(Mark)
        .use(Subscript)
        .use(Superscript);
};

export type MarkdownBlocksPresetOptions = {
    image?: false | Extension;
    lists?: ListsOptions;
    breaks?: BreaksOptions;
    deflist?: DeflistOptions;
    codeBlock?: CodeBlockOptions;
    blockquote?: BlockquoteOptions;
    heading?: false | Extension | HeadingOptions;
};

export const MarkdownBlocksPreset: ExtensionAuto<MarkdownBlocksPresetOptions> = (builder, opts) => {
    builder
        .use(Html)
        .use(Table)
        .use(HorizontalRule)
        .use(Lists, opts.lists ?? {})
        .use(Breaks, opts.breaks ?? {})
        .use(Deflist, opts.deflist ?? {})
        .use(CodeBlock, opts.codeBlock ?? {})
        .use(Blockquote, opts.blockquote ?? {});

    if (opts.image !== false) {
        builder.use(isFunction(opts.image) ? opts.image : Image);
    }

    if (opts.heading !== false) {
        if (isFunction(opts.heading)) builder.use(opts.heading);
        else builder.use(Heading, opts.heading ?? {});
    }
};
