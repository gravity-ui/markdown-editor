import type {NodeSpec} from 'prosemirror-model';

import {StatusAttr, defaultStatusColor, statusCn, statusColorDomAttr} from './const';
import {getStatusDomAttrs, normalizeStatusColor} from './utils';

export const statusNodeSpec: NodeSpec = {
    inline: true,
    atom: true,
    group: 'inline',
    selectable: true,
    allowSelection: true,
    attrs: {
        [StatusAttr.Text]: {default: ''},
        [StatusAttr.Color]: {default: defaultStatusColor},
    },
    parseDOM: [
        {
            tag: `span.${statusCn()}`,
            getAttrs(dom) {
                if (typeof dom === 'string') return false;
                return {
                    [StatusAttr.Text]: dom.textContent ?? '',
                    [StatusAttr.Color]: normalizeStatusColor(dom.getAttribute(statusColorDomAttr)),
                };
            },
        },
    ],
    toDOM(node) {
        const color = normalizeStatusColor(node.attrs[StatusAttr.Color]);
        return ['span', getStatusDomAttrs(color), node.attrs[StatusAttr.Text]];
    },
};
