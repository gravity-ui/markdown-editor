import deflistPlugin from '@diplodoc/transform/lib/plugins/deflist.js';
import type {NodeSpec} from 'prosemirror-model';

import type {ExtensionAuto} from '../../../../core';
import {nodeTypeFactory} from '../../../../utils/schema';

import {DeflistNode} from './const';
import {parserTokens} from './parser';
import {getSchemaSpecs} from './schema';
import {serializerTokens} from './serializer';

export {DeflistNode} from './const';
export const defListType = nodeTypeFactory(DeflistNode.List);
export const defTermType = nodeTypeFactory(DeflistNode.Term);
export const defDescType = nodeTypeFactory(DeflistNode.Desc);

export type DeflistSpecsOptions = {
    /**
     * @deprecated: use placeholder option in BehaviorPreset instead.
     */
    deflistTermPlaceholder?: NonNullable<NodeSpec['placeholder']>['content'];
    /**
     * @deprecated: use placeholder option in BehaviorPreset instead.
     */
    deflistDescPlaceholder?: NonNullable<NodeSpec['placeholder']>['content'];
};

export const DeflistSpecs: ExtensionAuto<DeflistSpecsOptions> = (builder, opts) => {
    const schemaSpecs = getSchemaSpecs(opts, builder.context.get('placeholder'));

    builder.configureMd((md) => md.use(deflistPlugin));
    builder
        .addNode(DeflistNode.List, () => ({
            spec: schemaSpecs[DeflistNode.List],
            fromMd: {tokenSpec: parserTokens[DeflistNode.List]},
            toMd: serializerTokens[DeflistNode.List],
        }))
        .addNode(DeflistNode.Term, () => ({
            spec: schemaSpecs[DeflistNode.Term],
            fromMd: {tokenSpec: parserTokens[DeflistNode.Term]},
            toMd: serializerTokens[DeflistNode.Term],
        }))
        .addNode(DeflistNode.Desc, () => ({
            spec: schemaSpecs[DeflistNode.Desc],
            fromMd: {tokenSpec: parserTokens[DeflistNode.Desc]},
            toMd: serializerTokens[DeflistNode.Desc],
        }));
};
