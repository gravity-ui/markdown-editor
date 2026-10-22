import type {DOMOutputSpec, NodeSpec} from 'prosemirror-model';

import {i18n} from '../../../../i18n/label';

import {LabelAttr, defaultLabelColor, labelCn, labelColorDomAttr} from './const';
import {getLabelDomAttrs, normalizeLabelColor} from './utils';

/** The DOM of the UIKit Label, with spans instead of divs to stay valid inside a paragraph. */
export const labelDomSpec = (color: unknown, text: string): DOMOutputSpec => [
    'span',
    getLabelDomAttrs(normalizeLabelColor(color)),
    [
        'span',
        {class: 'g-label__text'},
        [
            'span',
            {
                class: 'g-label__content',
                ...(text
                    ? {}
                    : {
                          'data-placeholder': i18n('default_caption'),
                          'aria-label': i18n('default_caption'),
                      }),
            },
            text,
        ],
    ],
];

export const labelNodeSpec: NodeSpec = {
    inline: true,
    atom: true,
    group: 'inline',
    selectable: true,
    allowSelection: true,
    fakeCursor: true,
    attrs: {
        [LabelAttr.Text]: {default: ''},
        [LabelAttr.Color]: {default: defaultLabelColor},
    },
    parseDOM: [
        {
            tag: `span.${labelCn()}`,
            getAttrs(dom) {
                if (typeof dom === 'string') return false;
                return {
                    [LabelAttr.Text]: dom.textContent ?? '',
                    [LabelAttr.Color]: normalizeLabelColor(dom.getAttribute(labelColorDomAttr)),
                };
            },
        },
    ],
    toDOM(node) {
        return labelDomSpec(node.attrs[LabelAttr.Color], node.attrs[LabelAttr.Text]);
    },
};
