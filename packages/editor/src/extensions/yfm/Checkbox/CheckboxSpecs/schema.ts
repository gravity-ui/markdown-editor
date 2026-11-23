import type {NodeSpec} from 'prosemirror-model';

import type {ExtensionAuto} from '#core';
import type {PlaceholderOptions} from 'src/utils/placeholder';

import {CheckboxAttr, CheckboxNode, b} from './const';
import {getCheckboxContent} from './dom';

const DEFAULT_LABEL_PLACEHOLDER = 'Checkbox';

export type GetSchemaSpecsOptions = {
    multiline?: boolean;
    /**
     * @deprecated use placeholder option in BehaviorPreset instead.
     */
    checkboxLabelPlaceholder?: NonNullable<NodeSpec['placeholder']>['content'];
};

export const getSchemaSpecs = (
    opts?: GetSchemaSpecsOptions,
    placeholder?: PlaceholderOptions,
): Record<CheckboxNode, NodeSpec> => ({
    [CheckboxNode.Checkbox]: {
        group: 'block checkbox',
        content: `${CheckboxNode.Input} ${CheckboxNode.Label}`,
        selectable: true,
        allowSelection: false,
        attrs: {
            [CheckboxAttr.Class]: {default: b(null, 'checkbox')},
            [CheckboxAttr.Line]: {default: null},
            ...(opts?.multiline ? {[CheckboxAttr.Tight]: {default: null}} : undefined),
        },
        parseDOM: [
            {tag: 'div.checkbox', priority: 100, getContent: getCheckboxContent},
            {tag: 'input[type=checkbox]', priority: 50, getContent: getCheckboxContent},
        ],
        toDOM(node) {
            return ['div', node.attrs, 0];
        },
        complex: 'root',
    },

    [CheckboxNode.Input]: {
        group: 'block checkbox',
        parseDOM: [],
        attrs: {
            [CheckboxAttr.Type]: {default: 'checkbox'},
            [CheckboxAttr.Id]: {default: null},
            [CheckboxAttr.Checked]: {default: null},
        },
        toDOM(node) {
            return ['div', node.attrs];
        },
        selectable: false,
        allowSelection: false,
        complex: 'leaf',
    },

    [CheckboxNode.Label]: {
        content: 'inline*',
        group: 'block checkbox',
        parseDOM: [
            {
                tag: `span[class="${b('label')}"]`,
                getAttrs: (node) => ({
                    [CheckboxAttr.For]: (node as Element).getAttribute(CheckboxAttr.For) || '',
                }),
            },
            {
                // input handled by checkbox node parse rule
                // ignore label
                tag: 'input[type=checkbox] ~ label',
                ignore: true,
                consuming: true,
            },
        ],
        attrs: {
            [CheckboxAttr.For]: {default: null},
        },
        escapeText: false,
        placeholder: {
            content:
                placeholder?.[CheckboxNode.Label] ??
                opts?.checkboxLabelPlaceholder ??
                DEFAULT_LABEL_PLACEHOLDER,
            alwaysVisible: true,
        },
        toDOM(node) {
            return ['span', {...node.attrs, class: b('label')}, 0];
        },
        selectable: false,
        allowSelection: false,
        disableGapCursor: true,
        canContainBreaks: Boolean(opts?.multiline),
        complex: 'leaf',
    },
});

export const CheckboxSchemaSpecs: ExtensionAuto<GetSchemaSpecsOptions> = (builder, opts) => {
    const schemaSpecs = getSchemaSpecs(opts, builder.context.get('placeholder'));

    builder
        .addNodeSpec(CheckboxNode.Checkbox, () => schemaSpecs[CheckboxNode.Checkbox])
        .addNodeSpec(CheckboxNode.Input, () => schemaSpecs[CheckboxNode.Input])
        .addNodeSpec(CheckboxNode.Label, () => schemaSpecs[CheckboxNode.Label]);
};
