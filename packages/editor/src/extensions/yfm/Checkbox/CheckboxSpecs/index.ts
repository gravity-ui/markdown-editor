import type {ExtensionAuto, NodeViewFactory} from '#core';

import {CheckboxNode} from './const';
import {CheckboxParserSpecs} from './parser';
import {CheckboxSchemaSpecs, type GetSchemaSpecsOptions} from './schema';
import {CheckboxSerializerSpecs} from './serializer';

export {
    CheckboxAttr,
    CheckboxNode,
    checkboxType,
    checkboxLabelType,
    checkboxInputType,
} from './const';

export type CheckboxSpecsOptions = GetSchemaSpecsOptions & {
    /** @deprecated Register the view with builder.addNodeView() after the specs. */
    inputView?: NodeViewFactory;
    /** @deprecated Register the view with builder.addNodeView() after the specs. */
    labelView?: NodeViewFactory;
    /** @deprecated Register the view with builder.addNodeView() after the specs. */
    checkboxView?: NodeViewFactory;
};

export const CheckboxSpecs: ExtensionAuto<CheckboxSpecsOptions> = (builder, opts) => {
    builder.use(CheckboxSchemaSpecs, opts).use(CheckboxParserSpecs).use(CheckboxSerializerSpecs);

    if (opts.checkboxView) {
        builder.addNodeView(CheckboxNode.Checkbox, opts.checkboxView);
    }

    if (opts.inputView) {
        builder.addNodeView(CheckboxNode.Input, opts.inputView);
    }

    if (opts.labelView) {
        builder.addNodeView(CheckboxNode.Label, opts.labelView);
    }
};
