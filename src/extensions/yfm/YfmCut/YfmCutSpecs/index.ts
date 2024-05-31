import log from '@diplodoc/transform/lib/log';
import yfmPlugin from '@diplodoc/transform/lib/plugins/cut';
import type {NodeSpec} from 'prosemirror-model';

import type {ExtensionAuto, WENodeSpec} from '../../../../core';

import {CutNode} from './const';
import {fromYfm} from './fromYfm';
import {getSpec} from './spec';
import {toYfm} from './toYfm';

export {CutNode, cutType, cutTitleType, cutContentType} from './const';

export type YfmCutSpecsOptions = {
    cutView?: WENodeSpec['view'];
    cutTitleView?: WENodeSpec['view'];
    cutContentView?: WENodeSpec['view'];
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
            toMd: toYfm[CutNode.Cut],
            fromMd: {
                tokenSpec: fromYfm[CutNode.Cut],
            },
            view: opts.cutView,
        }))
        .addNode(CutNode.CutTitle, () => ({
            spec: spec[CutNode.CutTitle],
            toMd: toYfm[CutNode.CutTitle],
            fromMd: {
                tokenSpec: fromYfm[CutNode.CutTitle],
            },
            view: opts.cutTitleView,
        }))
        .addNode(CutNode.CutContent, () => ({
            spec: spec[CutNode.CutContent],
            toMd: toYfm[CutNode.CutContent],
            fromMd: {
                tokenSpec: fromYfm[CutNode.CutContent],
            },
            view: opts.cutContentView,
        }));
};
