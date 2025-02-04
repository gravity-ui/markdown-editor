import {transform as yfmCut} from '@diplodoc/cut-extension';

import type {ExtensionAuto, ExtensionNodeSpec} from '../../../../core';

import {CutNode} from './const';
import {parserTokens} from './parser';
import {type YfmCutSchemaOptions, getSchemaSpecs} from './schema';
import {getSerializerTokens} from './serializer';

export {CutAttr, CutNode, cutType, cutTitleType, cutContentType} from './const';

declare global {
    namespace MarkdownEditor {
        interface DirectiveSyntaxAdditionalSupportedExtensions {
            // Mark in global types that YfmCut has support for directive syntax
            yfmCut: true;
        }
    }
}

export type YfmCutSpecsOptions = YfmCutSchemaOptions & {
    cutView?: ExtensionNodeSpec['view'];
    cutTitleView?: ExtensionNodeSpec['view'];
    cutContentView?: ExtensionNodeSpec['view'];
};

export const YfmCutSpecs: ExtensionAuto<YfmCutSpecsOptions> = (builder, opts) => {
    const schemaSpecs = getSchemaSpecs(opts, builder.context.get('placeholder'));
    const directiveSyntax = builder.context.get('directiveSyntax');
    const serializerTokens = getSerializerTokens({directiveSyntax});

    builder
        .configureMd((md) =>
            md.use(
                yfmCut({
                    bundle: false,
                    directiveSyntax: directiveSyntax?.mdPluginValueFor('yfmCut'),
                }),
            ),
        )
        .addNode(CutNode.Cut, () => ({
            spec: schemaSpecs[CutNode.Cut],
            toMd: serializerTokens[CutNode.Cut],
            fromMd: {
                tokenSpec: parserTokens[CutNode.Cut],
            },
            view: opts.cutView,
        }))
        .addNode(CutNode.CutTitle, () => ({
            spec: schemaSpecs[CutNode.CutTitle],
            toMd: serializerTokens[CutNode.CutTitle],
            fromMd: {
                tokenSpec: parserTokens[CutNode.CutTitle],
            },
            view: opts.cutTitleView,
        }))
        .addNode(CutNode.CutContent, () => ({
            spec: schemaSpecs[CutNode.CutContent],
            toMd: serializerTokens[CutNode.CutContent],
            fromMd: {
                tokenSpec: parserTokens[CutNode.CutContent],
            },
            view: opts.cutContentView,
        }));
};
