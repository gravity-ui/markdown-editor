import {directiveParser, registerContainerDirective} from '@diplodoc/directive';
import type {PluginSimple} from 'markdown-it';

import {bannerContentClassName, bannerContentTokenName} from './const';

const openTokenName = `${bannerContentTokenName}_open`;
const closeTokenName = `${bannerContentTokenName}_close`;

export const bannerContentPlugin: PluginSimple = (md) => {
    md.use(directiveParser());
    registerContainerDirective(md, {
        name: 'banner-content',
        match: ({inlineContent, dests, contentTitle}) => !inlineContent && !dests && !contentTitle,
        container: {
            tag: 'div',
            token: bannerContentTokenName,
            attrs: {class: bannerContentClassName},
        },
    });
    // An empty description renders nothing.
    const {rules} = md.renderer;
    rules[openTokenName] = (tokens, idx, options, _env, self) =>
        tokens[idx + 1]?.type === closeTokenName ? '' : self.renderToken(tokens, idx, options);
    rules[closeTokenName] = (tokens, idx, options, _env, self) =>
        tokens[idx - 1]?.type === openTokenName ? '' : self.renderToken(tokens, idx, options);
};
