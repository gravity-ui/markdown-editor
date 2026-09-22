import type {ExtensionAuto} from '#core';

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

export type YfmCutSpecsOptions = YfmCutSchemaOptions & {};

export const YfmCutSpecs: ExtensionAuto<YfmCutSpecsOptions> = (builder, opts) => {
    builder.use(YfmCutSchemaSpecs, opts).use(YfmCutParserSpecs).use(YfmCutSerializerSpecs);
};
