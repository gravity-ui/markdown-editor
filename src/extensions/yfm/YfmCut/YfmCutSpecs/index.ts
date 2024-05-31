import log from '@diplodoc/transform/lib/log';
import yfmPlugin from '@diplodoc/transform/lib/plugins/cut';
import type {NodeSpec} from 'prosemirror-model';

import type {ExtensionAuto, ExtensionNodeSpec} from '../../../../core';

import {CutNode} from './const';
import {parserTokens} from './parser';
import {getSchemaSpecs} from './schema';
import {serializerTokens} from './serializer';

export {CutNode, cutType, cutTitleType, cutContentType} from './const';

export type YfmCutSpecsOptions = {
    cutView?: ExtensionNodeSpec['view'];
    cutTitleView?: ExtensionNodeSpec['view'];
    cutContentView?: ExtensionNodeSpec['view'];
    /**
     * @deprecated: use placeholder option in BehaviorPreset instead.
     */
    yfmCutTitlePlaceholder?: NonNullable<NodeSpec['placeholder']>['content'];
    /**
     * @deprecated: use placeholder option in BehaviorPreset instead.
     */
    yfmCutContentPlaceholder?: NonNullable<NodeSpec['placeholder']>['content'];
};

export const YfmCutSpecs: ExtensionAuto<YfmCutSpecsOptions> = (builder, opts) => {
    const schemaSpecs = getSchemaSpecs(opts, builder.context.get('placeholder'));

    builder
        .configureMd((md) => md.use(yfmPlugin, {log}))
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
