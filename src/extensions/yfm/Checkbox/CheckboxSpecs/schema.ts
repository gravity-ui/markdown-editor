import {Fragment, type NodeSpec, type Schema} from 'prosemirror-model';

import type {PlaceholderOptions} from '../../../../utils/placeholder';

import {CheckboxAttr, CheckboxNode, b, checkboxInputType, checkboxLabelType} from './const';

import type {CheckboxSpecsOptions} from './index';

const DEFAULT_LABEL_PLACEHOLDER = 'Checkbox';

export const getSchemaSpecs = (
    opts?: Pick<CheckboxSpecsOptions, 'checkboxLabelPlaceholder'>,
    placeholder?: PlaceholderOptions,
): Record<CheckboxNode, NodeSpec> => ({
    [CheckboxNode.Checkbox]: {
        group: 'block checkbox',
        content: `${CheckboxNode.Input} ${CheckboxNode.Label}`,
        selectable: true,
        allowSelection: false,
        attrs: {
            [CheckboxAttr.Class]: {default: b()},
            [CheckboxAttr.Line]: {default: null},
        },
        parseDOM: [
            {
                tag: 'div.checkbox',
                priority: 100,
                getContent(node, schema) {
                    const input = (node as HTMLElement).querySelector<HTMLInputElement>(
                        'input[type=checkbox]',
                    );
                    if (!input) {
                        return Fragment.empty;
                    }

                    const label = findLabelForInput(input);
                    return createCheckboxFragment(schema, input.checked, label?.textContent);
                },
            },
            {
                tag: 'input[type=checkbox]',
                priority: 50,
                getContent(node, schema) {
                    const input = node as HTMLInputElement;
                    const label = findLabelForInput(input);
                    return createCheckboxFragment(schema, input.checked, label?.textContent);
                },
            },
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
                // ignore label with for attribute
                tag: 'input[type=checkbox] ~ label[for]',
                ignore: true,
                consuming: true,
            },
            {
                // input handled by checkbox node parse rule
                // ignore label without for attribute
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
        complex: 'leaf',
    },
});

// fallback for invalid HTML (input without id + label without for)
function findNextSiblingLabel(element: HTMLInputElement): HTMLLabelElement | null {
    const nextSibling = element.nextElementSibling;
    return nextSibling instanceof HTMLLabelElement ? nextSibling : null;
}

function findLabelForInput(element: HTMLInputElement): HTMLLabelElement | null {
    return element.labels?.[0] || findNextSiblingLabel(element);
}

function createCheckboxFragment(
    schema: Schema<any, any>,
    checked: boolean | null,
    labelText: string | null | undefined,
): Fragment {
    return Fragment.from([
        checkboxInputType(schema).create({[CheckboxAttr.Checked]: checked ? 'true' : null}),
        checkboxLabelType(schema).create(null, labelText ? schema.text(labelText) : null),
    ]);
}
