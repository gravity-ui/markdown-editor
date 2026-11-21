import {directiveParser, registerContainerDirective} from '@diplodoc/directive';
import type {PluginSimple} from 'markdown-it';
import type Renderer from 'markdown-it/lib/renderer';

import {bannerContentClassName, bannerContentTokenName} from './const';

const openTokenName = `${bannerContentTokenName}_open`;
const closeTokenName = `${bannerContentTokenName}_close`;

const renderOpen: Renderer.RenderRule = (tokens, idx, options, _env, self) =>
    tokens[idx + 1]?.type === closeTokenName ? '' : self.renderToken(tokens, idx, options);

const renderClose: Renderer.RenderRule = (tokens, idx, options, _env, self) =>
    tokens[idx - 1]?.type === openTokenName ? '' : self.renderToken(tokens, idx, options);

export const bannerContentPlugin: PluginSimple = (md) => {
    md.use(directiveParser());
    registerContainerDirective(md, {
        name: bannerContentTokenName,
        match: ({inlineContent, dests, contentTitle}) => !inlineContent && !dests && !contentTitle,
        container: {
            tag: 'div',
            token: bannerContentTokenName,
            attrs: {class: bannerContentClassName},
        },
    });
    const {rules} = md.renderer;
    rules[openTokenName] = renderOpen;
    rules[closeTokenName] = renderClose;
};
