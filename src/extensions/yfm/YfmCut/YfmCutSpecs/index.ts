import log from '@doc-tools/transform/lib/log';
import yfmPlugin from '@doc-tools/transform/lib/plugins/cut';
import type {NodeSpec} from 'prosemirror-model';

import type {ExtensionAuto, YENodeSpec} from '../../../../core';
import {nodeTypeFactory} from '../../../../utils/schema';
import {CutNode} from './const';
import {fromYfm} from './fromYfm';
import {getSpec} from './spec';
import {toYfm} from './toYfm';

export {CutNode} from './const';
export const cutType = nodeTypeFactory(CutNode.Cut);
export const cutTitleType = nodeTypeFactory(CutNode.CutTitle);
export const cutContentType = nodeTypeFactory(CutNode.CutContent);

export type YfmCutSpecsOptions = {
    cutView?: YENodeSpec['view'];
    cutTitleView?: YENodeSpec['view'];
    cutContentView?: YENodeSpec['view'];
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
    const spec = getSpec(opts, builder.context.get('placeholder'));

    builder
        .configureMd((md) => md.use(yfmPlugin, {log}))
        .addNode(CutNode.Cut, () => ({
            spec: spec[CutNode.Cut],
            toYfm: toYfm[CutNode.Cut],
            fromYfm: {
                tokenSpec: fromYfm[CutNode.Cut],
            },
            view: opts.cutView,
        }))
        .addNode(CutNode.CutTitle, () => ({
            spec: spec[CutNode.CutTitle],
            toYfm: toYfm[CutNode.CutTitle],
            fromYfm: {
                tokenSpec: fromYfm[CutNode.CutTitle],
            },
            view: opts.cutTitleView,
        }))
        .addNode(CutNode.CutContent, () => ({
            spec: spec[CutNode.CutContent],
            toYfm: toYfm[CutNode.CutContent],
            fromYfm: {
                tokenSpec: fromYfm[CutNode.CutContent],
            },
            view: opts.cutContentView,
        }));
};
