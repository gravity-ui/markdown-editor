import type {Extension, ExtensionAuto} from '../core';
import {
    BlockquoteSpecs,
    BoldSpecs,
    BreaksSpecs,
    BreaksSpecsOptions,
    CodeBlockSpecs,
    CodeBlockSpecsOptions,
    CodeSpecs,
    HeadingSpecs,
    HeadingSpecsOptions,
    HorizontalRuleSpecs,
    Html,
    ImageSpecs,
    ItalicSpecs,
    LinkSpecs,
    ListsSpecs,
} from '../extensions/markdown/specs';
import {isFunction} from '../lodash';

import {ZeroPreset, ZeroPresetOptions} from './zero';

export type CommonMarkSpecsPresetOptions = ZeroPresetOptions & {
    image?: false | Extension;
    breaks?: BreaksSpecsOptions;
    codeBlock?: CodeBlockSpecsOptions;
    heading?: false | Extension | HeadingSpecsOptions;
};

export const CommonMarkSpecsPreset: ExtensionAuto<CommonMarkSpecsPresetOptions> = (
    builder,
    opts,
) => {
    builder.use(ZeroPreset, opts);

    builder
        .use(Html)
        .use(BoldSpecs)
        .use(ItalicSpecs)
        .use(CodeSpecs)
        .use(LinkSpecs)
        .use(ListsSpecs)
        .use(BlockquoteSpecs)
        .use(HorizontalRuleSpecs)
        .use(BreaksSpecs, opts.breaks ?? {})
        .use(CodeBlockSpecs, opts.codeBlock ?? {});

    if (opts.image !== false) {
        builder.use(isFunction(opts.image) ? opts.image : ImageSpecs);
    }

    if (opts.heading !== false) {
        if (isFunction(opts.heading)) builder.use(opts.heading);
        else builder.use(HeadingSpecs, opts.heading ?? {});
    }
};
