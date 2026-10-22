import type {DOMOutputSpec, NodeSpec} from 'prosemirror-model';

import {DateAttr, dateCn} from './const';
import {formatDisplayDate, getDateDomAttrs, isIsoDate} from './utils';

/** The DOM of the UIKit Label on the `time` element, which stays valid inside a paragraph. */
export const dateDomSpec = (value: string): DOMOutputSpec => [
    'time',
    getDateDomAttrs(value),
    [
        'span',
        {class: 'g-label__text'},
        ['span', {class: 'g-label__content'}, formatDisplayDate(value)],
    ],
];

export const dateNodeSpec: NodeSpec = {
    inline: true,
    atom: true,
    group: 'inline',
    selectable: true,
    allowSelection: true,
    // Draws the fake cursor at the edges, see the InlineAtom plugins.
    fakeCursor: true,
    attrs: {
        [DateAttr.Date]: {
            validate(value) {
                if (!isIsoDate(value)) throw new RangeError(`Invalid date: ${value}`);
            },
        },
    },
    parseDOM: [
        {
            tag: `time.${dateCn()}`,
            getAttrs(dom) {
                if (typeof dom === 'string') return false;
                const value = dom.getAttribute('datetime');
                return isIsoDate(value) ? {[DateAttr.Date]: value} : false;
            },
        },
    ],
    toDOM(node) {
        return dateDomSpec(node.attrs[DateAttr.Date]);
    },
};
