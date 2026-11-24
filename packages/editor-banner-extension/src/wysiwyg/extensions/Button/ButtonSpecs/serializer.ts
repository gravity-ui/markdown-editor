import {escapeParenthesesInUrl} from '@gravity-ui/markdown-editor/_/extensions/markdown/Link/LinkSpecs/utils.js';
import type {ExtensionAuto} from '@gravity-ui/markdown-editor/core';
import {buttonDefaults, buttonModel} from '@gravity-ui/markdown-plugin-banner';

import {directiveAttrs, escapeDirectiveLabel, escapeQuoted} from '../../../utils/directive';

import {buttonNodeName} from './const';
import {buttonLabel} from './utils';

export const ButtonSerializerSpecs: ExtensionAuto = (builder) => {
    builder.addNodeSerializerSpec(buttonNodeName, () => (state, node) => {
        const {href, title, view, color, target} = buttonModel(node.attrs);
        const titlePart = title ? ` "${escapeQuoted(title)}"` : '';
        const link = href ? `(${escapeParenthesesInUrl(href)}${titlePart})` : '';
        const attrs = directiveAttrs({
            view,
            color,
            ...(target === buttonDefaults.target ? {} : {target}),
        });
        state.write(`:button[${escapeDirectiveLabel(buttonLabel(node))}]${link}${attrs}`);
    });
};
