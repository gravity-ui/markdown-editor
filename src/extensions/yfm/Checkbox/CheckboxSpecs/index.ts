import checkboxPlugin from '@diplodoc/transform/lib/plugins/checkbox';
import type {NodeSpec} from 'prosemirror-model';

import type {ExtensionAuto, WENodeSpec} from '../../../../core';
import {nodeTypeFactory} from '../../../../utils/schema';

import {CheckboxNode, b, idPrefix} from './const';
import {fromYfm} from './fromYfm';
import {getSpec} from './spec';
import {toYfm} from './toYfm';

export {CheckboxNode} from './const';
export const checkboxType = nodeTypeFactory(CheckboxNode.Checkbox);
export const checkboxLabelType = nodeTypeFactory(CheckboxNode.Label);
export const checkboxInputType = nodeTypeFactory(CheckboxNode.Input);

export type CheckboxSpecsOptions = {
    /**
     * @deprecated: use placeholder option in BehaviorPreset instead.
     */
    checkboxLabelPlaceholder?: NonNullable<NodeSpec['placeholder']>['content'];
    inputView?: WENodeSpec['view'];
    labelView?: WENodeSpec['view'];
    checkboxView?: WENodeSpec['view'];
};

export const CheckboxSpecs: ExtensionAuto<CheckboxSpecsOptions> = (builder, opts) => {
    const spec = getSpec(opts, builder.context.get('placeholder'));

    builder
        .configureMd((md) => checkboxPlugin(md, {idPrefix, divClass: b()}))
        .addNode(CheckboxNode.Checkbox, () => ({
            spec: spec[CheckboxNode.Checkbox],
            toMd: toYfm[CheckboxNode.Checkbox],
            fromMd: {
                tokenSpec: fromYfm[CheckboxNode.Checkbox],
            },
            view: opts.checkboxView,
        }))
        .addNode(CheckboxNode.Input, () => ({
            spec: spec[CheckboxNode.Input],
            toMd: toYfm[CheckboxNode.Input],
            fromMd: {
                tokenSpec: fromYfm[CheckboxNode.Input],
            },
            view: opts.inputView,
        }))
        .addNode(CheckboxNode.Label, () => ({
            spec: spec[CheckboxNode.Label],
            toMd: toYfm[CheckboxNode.Label],
            fromMd: {
                tokenSpec: fromYfm[CheckboxNode.Label],
                tokenName: 'checkbox_label',
            },
            view: opts.labelView,
        }));
};
