import type {Extension, ExtensionAuto} from '../../core';
import {isFunction} from '../../lodash';

import {BlockquoteSpecs} from './Blockquote/BlockquoteSpecs';
import {BoldSpecs} from './Bold/BoldSpecs';
import {BreaksSpecs, BreaksSpecsOptions} from './Breaks/BreaksSpecs';
import {CodeSpecs} from './Code/CodeSpecs';
import {CodeBlockSpecs, CodeBlockSpecsOptions} from './CodeBlock/CodeBlockSpecs';
import {DeflistSpecs, DeflistSpecsOptions} from './Deflist/DeflistSpecs';
import {HeadingSpecs, HeadingSpecsOptions} from './Heading/HeadingSpecs';
import {HorizontalRuleSpecs} from './HorizontalRule/HorizontalRuleSpecs';
import {Html} from './Html';
import {ImageSpecs} from './Image/ImageSpecs';
import {ItalicSpecs} from './Italic/ItalicSpecs';
import {LinkSpecs} from './Link/LinkSpecs';
import {ListsSpecs} from './Lists/ListsSpecs';
import {MarkSpecs} from './Mark/MarkSpecs';
import {StrikeSpecs} from './Strike/StrikeSpecs';
import {SubscriptSpecs} from './Subscript/SubscriptSpecs';
import {SuperscriptSpecs} from './Superscript/SuperscriptSpecs';
import {TableSpecs} from './Table/TableSpecs';
import {UnderlineSpecs} from './Underline/UnderlineSpecs';

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
