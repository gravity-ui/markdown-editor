import type {ExtensionAuto, ExtensionNodeSpec} from '#core';

import {CutNode} from './const';
import {YfmCutParserSpecs} from './parser';
import {type YfmCutSchemaOptions, YfmCutSchemaSpecs} from './schema';
import {YfmCutSerializerSpecs} from './serializer';

export {CutAttr, CutNode, cutType, cutTitleType, cutContentType, YfmCutClassName} from './const';

declare global {
    namespace MarkdownEditor {
        interface DirectiveSyntaxAdditionalSupportedExtensions {
            // Mark in global types that YfmCut has support for directive syntax
            yfmCut: true;
        }
    }
}

export type YfmCutSpecsOptions = YfmCutSchemaOptions & {
    /** @deprecated Register the view with builder.addNodeView() after the specs. */
    cutView?: ExtensionNodeSpec['view'];
    /** @deprecated Register the view with builder.addNodeView() after the specs. */
    cutTitleView?: ExtensionNodeSpec['view'];
    /** @deprecated Register the view with builder.addNodeView() after the specs. */
    cutContentView?: ExtensionNodeSpec['view'];
};

export const YfmCutSpecs: ExtensionAuto<YfmCutSpecsOptions> = (builder, opts) => {
    builder.use(YfmCutSchemaSpecs, opts).use(YfmCutParserSpecs).use(YfmCutSerializerSpecs);

    if (opts.cutView) {
        builder.addNodeView(CutNode.Cut, opts.cutView);
    }

    if (opts.cutTitleView) {
        builder.addNodeView(CutNode.CutTitle, opts.cutTitleView);
    }

    if (opts.cutContentView) {
        builder.addNodeView(CutNode.CutContent, opts.cutContentView);
    }
};
