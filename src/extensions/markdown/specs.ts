import isFunction from 'lodash/isFunction';
import type {Extension, ExtensionAuto} from '../../core';

import {BoldSpecs} from './Bold/BoldSpecs';
import {CodeSpecs} from './Code/CodeSpecs';
import {ItalicSpecs} from './Italic/ItalicSpecs';
import {StrikeSpecs} from './Strike/StrikeSpecs';
import {UnderlineSpecs} from './Underline/UnderlineSpecs';
import {LinkSpecs} from './Link/LinkSpecs';
import {MarkSpecs} from './Mark/MarkSpecs';
import {SubscriptSpecs} from './Subscript/SubscriptSpecs';
import {SuperscriptSpecs} from './Superscript/SuperscriptSpecs';

import {Html} from './Html';
import {TableSpecs} from './Table/TableSpecs';
import {ImageSpecs} from './Image/ImageSpecs';
import {ListsSpecs} from './Lists/ListsSpecs';
import {BreaksSpecs, BreaksSpecsOptions} from './Breaks/BreaksSpecs';
import {BlockquoteSpecs} from './Blockquote/BlockquoteSpecs';
import {DeflistSpecs, DeflistSpecsOptions} from './Deflist/DeflistSpecs';
import {HeadingSpecs, HeadingSpecsOptions} from './Heading/HeadingSpecs';
import {HorizontalRuleSpecs} from './HorizontalRule/HorizontalRuleSpecs';
import {CodeBlockSpecs, CodeBlockSpecsOptions} from './CodeBlock/CodeBlockSpecs';

export * from './Bold/BoldSpecs';
export * from './Code/CodeSpecs';
export * from './Link/LinkSpecs';
export * from './Italic/ItalicSpecs';
export * from './Strike/StrikeSpecs';
export * from './Underline/UnderlineSpecs';
export * from './Mark/MarkSpecs';
export * from './Subscript/SubscriptSpecs';
export * from './Superscript/SuperscriptSpecs';

export * from './Html';
export * from './Breaks/BreaksSpecs';
export * from './Blockquote/BlockquoteSpecs';
export * from './CodeBlock/CodeBlockSpecs';
export * from './Deflist/DeflistSpecs';
export * from './Image/ImageSpecs';
export * from './Lists/ListsSpecs';
export * from './Table/TableSpecs';
export * from './Heading/HeadingSpecs';
export * from './HorizontalRule/HorizontalRuleSpecs';

export type MarkdownMarksSpecsPresetOptions = {};

export const MarkdownMarksSpecsPreset: ExtensionAuto<MarkdownMarksSpecsPresetOptions> = (
    builder,
    _opts,
) => {
    builder
        .use(BoldSpecs)
        .use(CodeSpecs)
        .use(ItalicSpecs)
        .use(StrikeSpecs)
        .use(UnderlineSpecs)
        .use(LinkSpecs)
        .use(MarkSpecs)
        .use(SubscriptSpecs)
        .use(SuperscriptSpecs);
};

export type MarkdownBlocksSpecsPresetOptions = {
    image?: false | Extension;
    breaks?: BreaksSpecsOptions;
    codeBlock?: CodeBlockSpecsOptions;
    deflist?: DeflistSpecsOptions;
    heading?: false | Extension | HeadingSpecsOptions;
};

export const MarkdownBlocksSpecsPreset: ExtensionAuto<MarkdownBlocksSpecsPresetOptions> = (
    builder,
    opts,
) => {
    builder
        .use(Html)
        .use(ListsSpecs)
        .use(TableSpecs)
        .use(BreaksSpecs, opts.breaks ?? {})
        .use(BlockquoteSpecs)
        .use(HorizontalRuleSpecs)
        .use(DeflistSpecs, opts.deflist ?? {})
        .use(CodeBlockSpecs, opts.codeBlock ?? {});

    if (opts.image !== false) {
        builder.use(isFunction(opts.image) ? opts.image : ImageSpecs);
    }

    if (opts.heading !== false) {
        if (isFunction(opts.heading)) builder.use(opts.heading);
        else builder.use(HeadingSpecs, opts.heading ?? {});
    }
};
