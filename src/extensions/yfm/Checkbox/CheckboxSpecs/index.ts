import type {NodeSpec} from 'prosemirror-model';
import checkboxPlugin from '@doc-tools/transform/lib/plugins/checkbox';

import type {ExtensionAuto, YENodeSpec} from '../../../../core';
import {nodeTypeFactory} from '../../../../utils/schema';
import {b, CheckboxNode, idPrefix} from './const';
import {fromYfm} from './fromYfm';
import {getSpec} from './spec';
import {toYfm} from './toYfm';
import {PlaceholderOptions} from '../../../../utils/placeholder';

export {CheckboxNode} from './const';
export const checkboxType = nodeTypeFactory(CheckboxNode.Checkbox);
export const checkboxLabelType = nodeTypeFactory(CheckboxNode.Label);
export const checkboxInputType = nodeTypeFactory(CheckboxNode.Input);

export type CheckboxSpecsOptions = {
    /**
     * @deprecated: use placeholderOptions instead.
     */
    checkboxLabelPlaceholder?: NonNullable<NodeSpec['placeholder']>['content'];
    inputView?: YENodeSpec['view'];
    labelView?: YENodeSpec['view'];
    checkboxView?: YENodeSpec['view'];
    placeholderOptions?: PlaceholderOptions;
};

export const CheckboxSpecs: ExtensionAuto<CheckboxSpecsOptions> = (builder, opts) => {
    const spec = getSpec(opts);

    builder
        .configureMd((md) => checkboxPlugin(md, {idPrefix, divClass: b()}))
        .addNode(CheckboxNode.Checkbox, () => ({
            spec: spec[CheckboxNode.Checkbox],
            toYfm: toYfm[CheckboxNode.Checkbox],
            fromYfm: {
                tokenSpec: fromYfm[CheckboxNode.Checkbox],
            },
            view: opts.checkboxView,
        }))
        .addNode(CheckboxNode.Input, () => ({
            spec: spec[CheckboxNode.Input],
            toYfm: toYfm[CheckboxNode.Input],
            fromYfm: {
                tokenSpec: fromYfm[CheckboxNode.Input],
            },
            view: opts.inputView,
        }))
        .addNode(CheckboxNode.Label, () => ({
            spec: spec[CheckboxNode.Label],
            toYfm: toYfm[CheckboxNode.Label],
            fromYfm: {
                tokenSpec: fromYfm[CheckboxNode.Label],
                tokenName: 'checkbox_label',
            },
            view: opts.labelView,
        }));
};
