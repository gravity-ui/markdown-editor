import deflistPlugin from '@diplodoc/transform/lib/plugins/deflist';
import type {NodeSpec} from 'prosemirror-model';

import type {ExtensionAuto} from '../../../../core';
import {nodeTypeFactory} from '../../../../utils/schema';

import {DeflistNode} from './const';
import {fromYfm} from './fromYfm';
import {getSpec} from './spec';
import {toYfm} from './toYfm';

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
    const spec = getSpec(opts, builder.context.get('placeholder'));

    builder.configureMd((md) => md.use(deflistPlugin));
    builder
        .addNode(DeflistNode.List, () => ({
            spec: spec[DeflistNode.List],
            fromMd: {tokenSpec: fromYfm[DeflistNode.List]},
            toMd: toYfm[DeflistNode.List],
        }))
        .addNode(DeflistNode.Term, () => ({
            spec: spec[DeflistNode.Term],
            fromMd: {tokenSpec: fromYfm[DeflistNode.Term]},
            toMd: toYfm[DeflistNode.Term],
        }))
        .addNode(DeflistNode.Desc, () => ({
            spec: spec[DeflistNode.Desc],
            fromMd: {tokenSpec: fromYfm[DeflistNode.Desc]},
            toMd: toYfm[DeflistNode.Desc],
        }));
};
