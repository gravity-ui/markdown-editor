import {directiveParser, registerLeafBlockDirective} from '@diplodoc/directive';
import type {LeafBlockDirectiveHandler} from '@diplodoc/directive';
import type {PluginSimple} from 'markdown-it';
import type Renderer from 'markdown-it/lib/renderer';

import {blockDirectiveRawAttrs} from '../directive';
import {allowedImageUrl} from '../url';

import {bannerImageAttrs} from './attrs';
import {bannerImageTokenName} from './const';

const attrNames = ['src', 'alt', 'title'] as const;

const bannerImageDirective: LeafBlockDirectiveHandler = (state, params) => {
    if (params.inlineContent || params.dests) return false;
    const values = blockDirectiveRawAttrs(state, params, attrNames);
    const token = state.push(bannerImageTokenName, 'img', 0);
    token.map = [params.startLine, params.endLine];
    token.markup = `::${bannerImageTokenName}`;
    token.attrs = Object.entries(
        bannerImageAttrs({...values, src: allowedImageUrl(state.md, values.src)}),
    );
    return true;
};

const renderBannerImage: Renderer.RenderRule = (tokens, idx, options, _env, self) =>
    tokens[idx].attrGet('src') === null ? '' : self.renderToken(tokens, idx, options);

export const bannerImagePlugin: PluginSimple = (md) => {
    md.use(directiveParser());
    registerLeafBlockDirective(md, bannerImageTokenName, bannerImageDirective);
    const {rules} = md.renderer;
    rules[bannerImageTokenName] = renderBannerImage;
};
