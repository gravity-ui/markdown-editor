import type {ExtensionAuto} from '@gravity-ui/markdown-editor/core';
import {buttonDefaults} from '@gravity-ui/markdown-plugin-header';

import {directiveAttrs, escapeDirectiveLabel} from '../../directive';

import {buttonNodeName} from './const';
import {buttonLabel} from './utils';

export const ButtonSerializerSpecs: ExtensionAuto = (builder) => {
    builder.addNodeSerializerSpec(buttonNodeName, () => (state, node) => {
        const {href, view, color, target} = node.attrs;
        const attrs = directiveAttrs({
            ...(href ? {href: String(href)} : {}),
            view: String(view),
            color: String(color),
            ...(target === buttonDefaults.target ? {} : {target: String(target)}),
        });
        state.write(`:button[${escapeDirectiveLabel(buttonLabel(node))}]${attrs}`);
    });
};
