import deflistPlugin from 'markdown-it-deflist';
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
    deflistTermPlaceholder?: NonNullable<NodeSpec['placeholder']>['content'];
    deflistDescPlaceholder?: NonNullable<NodeSpec['placeholder']>['content'];
};

export const DeflistSpecs: ExtensionAuto<DeflistSpecsOptions> = (builder, opts) => {
    const spec = getSpec(opts);

    builder.configureMd((md) => md.use(deflistPlugin));
    builder
        .addNode(DeflistNode.List, () => ({
            spec: spec[DeflistNode.List],
            fromYfm: {tokenSpec: fromYfm[DeflistNode.List]},
            toYfm: toYfm[DeflistNode.List],
        }))
        .addNode(DeflistNode.Term, () => ({
            spec: spec[DeflistNode.Term],
            fromYfm: {tokenSpec: fromYfm[DeflistNode.Term]},
            toYfm: toYfm[DeflistNode.Term],
        }))
        .addNode(DeflistNode.Desc, () => ({
            spec: spec[DeflistNode.Desc],
            fromYfm: {tokenSpec: fromYfm[DeflistNode.Desc]},
            toYfm: toYfm[DeflistNode.Desc],
        }));
};
