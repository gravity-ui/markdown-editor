import {Fragment, type NodeSpec} from 'prosemirror-model';

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
                    const label = (node as HTMLElement).querySelector<HTMLLabelElement>(
                        'label[for]',
                    );

                    const checked = input?.checked ? 'true' : null;
                    const text = label?.textContent;

                    return Fragment.from([
                        checkboxInputType(schema).create({[CheckboxAttr.Checked]: checked}),
                        checkboxLabelType(schema).create(null, text ? schema.text(text) : null),
                    ]);
                },
            },
            {
                tag: 'input[type=checkbox]',
                priority: 50,
                getContent(node, schema) {
                    const element = node instanceof HTMLInputElement ? node : undefined;
                    const id = element.id;
                    const checked = (element as HTMLInputElement).checked ? 'true' : null;

                    // find label by id if present, otherwise find next sibling label
                    const labelById = element.parentNode?.querySelector<HTMLLabelElement>(
                        `label[for="${id}"]`,
                    );
                    const nextSibling = element.nextElementSibling;
                    const labelNext =
                        nextSibling?.tagName === 'LABEL' ? (nextSibling as HTMLLabelElement) : null;
                    const text = (id ? labelById : labelNext)?.textContent || undefined;

                    return Fragment.from([
                        checkboxInputType(schema).create({[CheckboxAttr.Checked]: checked}),
                        checkboxLabelType(schema).create(null, text ? schema.text(text) : null),
                    ]);
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
