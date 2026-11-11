import type {ExtensionAuto} from '@gravity-ui/markdown-editor/core';
import {
    type ButtonModel,
    buttonAttrs,
    buttonClassName,
    buttonDefaults,
    buttonFromAttrs,
} from '@gravity-ui/markdown-plugin-header';

import {buttonNodeName} from './const';
export const ButtonSchemaSpecs: ExtensionAuto = (builder) => {
    builder.addNodeSpec(buttonNodeName, () => ({
        group: 'block',
        atom: true,
        draggable: true,
        selectable: true,
        attrs: {
            href: {default: buttonDefaults.href},
            view: {default: buttonDefaults.view},
            color: {default: buttonDefaults.color},
            target: {default: buttonDefaults.target},
            content: {default: ''},
        },
        parseDOM: [
            {
                tag: `a.${buttonClassName}`,
                priority: 60,
                getAttrs: (dom) => ({
                    ...buttonFromAttrs((name) => dom.getAttribute(name)),
                    content: dom.textContent ?? '',
                }),
            },
        ],
        toDOM: (node) => ['a', buttonAttrs(node.attrs as ButtonModel), node.attrs.content],
    }));
};
