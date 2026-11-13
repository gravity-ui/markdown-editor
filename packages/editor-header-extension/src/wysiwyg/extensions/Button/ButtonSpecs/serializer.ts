import type {ExtensionAuto} from '@gravity-ui/markdown-editor/core';
import {buttonDefaultColor, buttonDefaults} from '@gravity-ui/markdown-plugin-header';

import {buttonNodeName} from './const';
import {buttonLabel} from './utils';

export const ButtonSerializerSpecs: ExtensionAuto = (builder) => {
    builder.addNodeSerializerSpec(buttonNodeName, () => (state, node) => {
        const defaults = {...buttonDefaults, color: buttonDefaultColor(node.attrs.view)};
        const attrs = (['href', 'view', 'color', 'target'] as const)
            .filter((name) => node.attrs[name] !== defaults[name])
            .map((name) => `${name}="${String(node.attrs[name]).replace(/[\\"]/g, '\\$&')}"`)
            .join(' ');
        const label = buttonLabel(node);
        state.write(`:::button${attrs ? `{${attrs}}` : ''}\n`);
        state.text(label.endsWith('\n') ? label : `${label}\n`, false);
        state.write(':::');
        state.closeBlock(node);
    });
};
