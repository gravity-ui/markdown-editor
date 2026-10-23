import type {NodeSpec} from '#pm/model';
import {i18n} from 'src/i18n/header';

import {HeaderClassName, headerMarkupAttr} from './const';

export const headerStubSpec: NodeSpec = {
    atom: true,
    group: 'block',
    attrs: {[headerMarkupAttr]: {default: ''}},
    selectable: true,
    parseDOM: [
        {
            tag: `div.${HeaderClassName.Stub}`,
            getAttrs: (dom) => ({
                [headerMarkupAttr]:
                    (dom as Element).querySelector(`.${HeaderClassName.StubMarkup}`)?.textContent ??
                    '',
            }),
        },
    ],
    toDOM: (node) => [
        'div',
        {class: HeaderClassName.Stub, contenteditable: 'false'},
        ['div', {class: HeaderClassName.StubMessage}, i18n('stub')],
        ['pre', {class: HeaderClassName.StubMarkup}, node.attrs[headerMarkupAttr]],
    ],
};
