import type {ExtensionAuto} from '@gravity-ui/markdown-editor/core';
import {
    buttonAttrs,
    buttonClassName,
    buttonDefaults,
    buttonFromAttrs,
} from '@gravity-ui/markdown-plugin-header';

import {i18n} from '../../../../i18n';

import {buttonNodeName} from './const';

export const ButtonSchemaSpecs: ExtensionAuto = (builder) => {
    const placeholder = builder.context.get('placeholder')?.[buttonNodeName];
    builder.addNodeSpec(buttonNodeName, () => ({
        group: 'inline',
        inline: true,
        content: 'text*',
        marks: '',
        attrs: {
            href: {default: buttonDefaults.href},
            view: {default: buttonDefaults.view},
            color: {default: buttonDefaults.color},
            target: {default: buttonDefaults.target},
        },
        placeholder: {
            content: placeholder ?? (() => i18n('button-placeholder')),
            alwaysVisible: true,
        },
        parseDOM: [
            {
                tag: `a.${buttonClassName}`,
                priority: 60,
                getAttrs: (dom) => buttonFromAttrs((name) => dom.getAttribute(name)),
            },
        ],
        toDOM: (node) => ['a', buttonAttrs(node.attrs), 0],
    }));
};
