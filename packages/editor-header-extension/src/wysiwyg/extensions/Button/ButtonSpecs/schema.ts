import type {ExtensionAuto} from '@gravity-ui/markdown-editor/core';
import {
    buttonAttrs,
    buttonClassName,
    normalizeButtonStyle,
} from '@gravity-ui/markdown-plugin-header';

import {buttonNodeName} from './const';
export const ButtonSchemaSpecs: ExtensionAuto = (builder) => {
    builder.addNodeSpec(buttonNodeName, () => ({
        group: 'block',
        atom: true,
        draggable: true,
        selectable: true,
        attrs: {
            href: {default: ''},
            view: {default: 'action'},
            color: {default: 'standard'},
            target: {default: '_self'},
            content: {default: ''},
        },
        parseDOM: [
            {
                tag: `a.${buttonClassName}`,
                priority: 60,
                getAttrs: (dom) => ({
                    ...normalizeButtonStyle({
                        view: dom.getAttribute('data-view'),
                        color: dom.getAttribute('data-color'),
                        target: dom.getAttribute('target'),
                    }),
                    href: dom.getAttribute('href') ?? '',
                    content: dom.getAttribute('data-button-content') ?? dom.textContent ?? '',
                }),
            },
        ],
        toDOM: (node) => [
            'a',
            {
                ...buttonAttrs({...normalizeButtonStyle(node.attrs), href: node.attrs.href}),
                'data-button-content': node.attrs.content,
            },
            node.attrs.content.trim(),
        ],
    }));
};
