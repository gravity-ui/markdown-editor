import type {NodeSpec} from 'prosemirror-model';

import {PlaceholderOptions} from '../../../../utils/placeholder';
import {CheckboxNode, b} from '../const';

import type {CheckboxSpecsOptions} from './index';

const DEFAULT_LABEL_PLACEHOLDER = 'Checkbox';

export const getSchemaSpecs = (
    opts?: Pick<CheckboxSpecsOptions, 'checkboxLabelPlaceholder'>,
    placeholder?: PlaceholderOptions,
): Record<CheckboxNode, NodeSpec> => ({
    [CheckboxNode.Checkbox]: {
        group: 'block',
        content: `${CheckboxNode.Input} ${CheckboxNode.Label}`,
        selectable: true,
        allowSelection: false,
        parseDOM: [],
        attrs: {
            class: {default: b()},
        },
        toDOM(node) {
            return ['div', node.attrs, 0];
        },
        complex: 'root',
    },

    [CheckboxNode.Input]: {
        group: 'block',
        parseDOM: [],
        attrs: {
            type: {default: 'checkbox'},
            id: {default: null},
            checked: {default: null},
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
        group: 'block',
        parseDOM: [
            {
                tag: `span[class="${b('label')}"]`,
                getAttrs: (node) => ({
                    for: (node as Element).getAttribute('for') || '',
                }),
            },
        ],
        attrs: {
            for: {default: null},
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
