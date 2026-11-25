import {escapeParenthesesInUrl} from '@gravity-ui/markdown-editor/_/extensions/markdown/Link/LinkSpecs/utils.js';
import type {ExtensionAuto} from '@gravity-ui/markdown-editor/core';
import {buttonDefaults, buttonModel} from '@gravity-ui/markdown-plugin-banner';

import {escapeDirectiveLabel, singleLine} from '../../../utils/directive';

import {buttonNodeName} from './const';
import {buttonLabel} from './utils';

// A table row ends at an unescaped `|`.
const escapeLabel = (label: string) =>
    escapeDirectiveLabel(singleLine(label)).replace(/\|/g, '\\|');
const escapeQuoted = (value: string) => value.replace(/[\\"]/g, '\\$&');

export const ButtonSerializerSpecs: ExtensionAuto = (builder) => {
    builder.addNodeSerializerSpec(buttonNodeName, () => (state, node) => {
        const {href, title, view, color, target} = buttonModel(node.attrs);
        const titlePart = title ? ` "${escapeQuoted(title)}"` : '';
        const link = href ? `(${escapeParenthesesInUrl(href)}${titlePart})` : '';
        const attrs = Object.entries({
            view,
            color,
            ...(target === buttonDefaults.target ? {} : {target}),
        })
            .map(([name, value]) => `${name}="${escapeQuoted(value)}"`)
            .join(' ');
        state.write(`:button[${escapeLabel(buttonLabel(node))}]${link}{${attrs}}`);
    });
};
