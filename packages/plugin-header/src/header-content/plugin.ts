import {directiveParser, registerContainerDirective} from '@diplodoc/directive';
import type {PluginSimple} from 'markdown-it';

import {headerContentClassName, headerContentTokenName} from './const';

const openTokenName = `${headerContentTokenName}_open`;
const closeTokenName = `${headerContentTokenName}_close`;

export const headerContentPlugin: PluginSimple = (md) => {
    md.use(directiveParser());
    registerContainerDirective(md, {
        name: headerContentTokenName,
        match: ({inlineContent, dests, contentTitle}) => !inlineContent && !dests && !contentTitle,
        container: {
            tag: 'div',
            token: headerContentTokenName,
            attrs: {class: headerContentClassName},
        },
    });
    const {rules} = md.renderer;
    rules[openTokenName] = (tokens, idx, options, _env, self) =>
        tokens[idx + 1]?.type === closeTokenName ? '' : self.renderToken(tokens, idx, options);
    rules[closeTokenName] = (tokens, idx, options, _env, self) =>
        tokens[idx - 1]?.type === openTokenName ? '' : self.renderToken(tokens, idx, options);
};
