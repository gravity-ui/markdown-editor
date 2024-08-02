import checkboxPlugin from '@diplodoc/transform/lib/plugins/checkbox';
import type {NodeSpec} from 'prosemirror-model';

import type {ExtensionAuto, ExtensionNodeSpec} from '../../../../core';
import {nodeTypeFactory} from '../../../../utils/schema';

import {CheckboxNode, b, idPrefix} from './const';
import {parserTokens} from './parser';
import {getSchemaSpecs} from './schema';
import {serializerTokens} from './serializer';

export {CheckboxNode} from './const';
export const checkboxType = nodeTypeFactory(CheckboxNode.Checkbox);
export const checkboxLabelType = nodeTypeFactory(CheckboxNode.Label);
export const checkboxInputType = nodeTypeFactory(CheckboxNode.Input);

export type CheckboxSpecsOptions = {
    /**
     * @deprecated: use placeholder option in BehaviorPreset instead.
     */
    checkboxLabelPlaceholder?: NonNullable<NodeSpec['placeholder']>['content'];
    inputView?: ExtensionNodeSpec['view'];
    labelView?: ExtensionNodeSpec['view'];
    checkboxView?: ExtensionNodeSpec['view'];
};

export const CheckboxSpecs: ExtensionAuto<CheckboxSpecsOptions> = (builder, opts) => {
    const schemaSpecs = getSchemaSpecs(opts, builder.context.get('placeholder'));

    builder
        .configureMd((md) => md.use(checkboxPlugin, {idPrefix, divClass: b()}))
        .addNode(CheckboxNode.Checkbox, () => ({
            spec: schemaSpecs[CheckboxNode.Checkbox],
            toMd: serializerTokens[CheckboxNode.Checkbox],
            fromMd: {
                tokenSpec: parserTokens[CheckboxNode.Checkbox],
            },
            view: opts.checkboxView,
        }))
        .addNode(CheckboxNode.Input, () => ({
            spec: schemaSpecs[CheckboxNode.Input],
            toMd: serializerTokens[CheckboxNode.Input],
            fromMd: {
                tokenSpec: parserTokens[CheckboxNode.Input],
            },
            view: opts.inputView,
        }))
        .addNode(CheckboxNode.Label, () => ({
            spec: schemaSpecs[CheckboxNode.Label],
            toMd: serializerTokens[CheckboxNode.Label],
            fromMd: {
                tokenSpec: parserTokens[CheckboxNode.Label],
                tokenName: 'checkbox_label',
            },
            view: opts.labelView,
        }));
};
