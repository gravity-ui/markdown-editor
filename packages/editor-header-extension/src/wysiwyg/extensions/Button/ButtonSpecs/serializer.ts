import type {ExtensionAuto} from '@gravity-ui/markdown-editor/core';
import {buttonDefaults} from '@gravity-ui/markdown-plugin-header';

import {buttonNodeName} from './const';
import {buttonLabel} from './utils';

const escapeLabel = (label: string) => label.replace(/[\\[\]]/g, '\\$&');
const escapeAttr = (value: string) => value.replace(/[\\"]/g, '\\$&');

export const ButtonSerializerSpecs: ExtensionAuto = (builder) => {
    builder.addNodeSerializerSpec(buttonNodeName, () => (state, node) => {
        const {href, view, color, target} = node.attrs;
        const attrs = Object.entries({
            ...(href ? {href} : {}),
            view,
            color,
            ...(target === buttonDefaults.target ? {} : {target}),
        })
            .map(([name, value]) => `${name}="${escapeAttr(String(value))}"`)
            .join(' ');
        state.write(`:button[${escapeLabel(buttonLabel(node))}]{${attrs}}`);
    });
};
