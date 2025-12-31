import type {Extension, ExtensionAuto} from '../core';
import {
    Blockquote,
    type BlockquoteOptions,
    Bold,
    type BoldOptions,
    Breaks,
    type BreaksOptions,
    Code,
    CodeBlock,
    type CodeBlockOptions,
    type CodeOptions,
    Heading,
    type HeadingOptions,
    HorizontalRule,
    Html,
    Image,
    type ImageOptions,
    Italic,
    type ItalicOptions,
    Link,
    type LinkOptions,
    Lists,
    type ListsOptions,
} from '../extensions/markdown';
import {isFunction} from '../lodash';

import {ZeroPreset, type ZeroPresetOptions} from './zero';

export type CommonMarkPresetOptions = ZeroPresetOptions & {
    bold?: BoldOptions;
    code?: CodeOptions;
    link?: LinkOptions;
    lists?: ListsOptions;
    italic?: ItalicOptions;
    breaks?: BreaksOptions;
    image?: false | Extension | ImageOptions;
    codeBlock?: CodeBlockOptions;
    blockquote?: BlockquoteOptions;
    heading?: false | Extension | HeadingOptions;
};

export const CommonMarkPreset: ExtensionAuto<CommonMarkPresetOptions> = (builder, opts) => {
    builder.use(ZeroPreset, opts);

    builder
        .use(Html)
        .use(HorizontalRule)
        .use(Code, opts.code ?? {})
        .use(Bold, opts.bold ?? {})
        .use(Link, opts.link ?? {})
        .use(Lists, opts.lists ?? {})
        .use(Italic, opts.italic ?? {})
        .use(Breaks, opts.breaks ?? {})
        .use(CodeBlock, opts.codeBlock ?? {})
        .use(Blockquote, opts.blockquote ?? {});

    if (opts.image !== false) {
        if (isFunction(opts.image)) {
            builder.use(opts.image);
        } else {
            builder.use(Image, opts.image ?? {});
        }
    }

    if (opts.heading !== false) {
        if (isFunction(opts.heading)) builder.use(opts.heading);
        else builder.use(Heading, opts.heading ?? {});
    }
};
