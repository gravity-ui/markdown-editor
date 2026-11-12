import type {ExtensionAuto} from '@gravity-ui/markdown-editor/core';
import {
    buttonAttrs,
    buttonClassName,
    buttonDefaults,
    buttonFromAttrs,
} from '@gravity-ui/markdown-plugin-header';

import {i18n} from '../../../../i18n';

import {buttonNodeName} from './const';
import {buttonLabel} from './utils';

export const ButtonSchemaSpecs: ExtensionAuto = (builder) => {
    const placeholder = builder.context.get('placeholder')?.[buttonNodeName];
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
        placeholder: {content: placeholder ?? (() => i18n('button-placeholder'))},
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
        leafText: (node) => buttonLabel(node).trim(),
        toDOM: (node) => ['a', buttonAttrs(node.attrs), node.attrs.content],
    }));
};
