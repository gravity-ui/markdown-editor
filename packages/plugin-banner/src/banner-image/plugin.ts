import {directiveParser, registerLeafBlockDirective} from '@diplodoc/directive';
import type {PluginSimple} from 'markdown-it';

import {normalizeLinkUrl} from '../url';

import {bannerImageAttrs} from './attrs';
import {bannerImageTokenName} from './const';

export const bannerImagePlugin: PluginSimple = (md) => {
    md.use(directiveParser());
    registerLeafBlockDirective(md, 'banner-image', (state, params) => {
        if (params.inlineContent || params.dests) return false;
        const {attrs = {}} = params;
        const token = state.push(bannerImageTokenName, 'img', 0);
        token.map = [params.startLine, params.endLine];
        token.markup = '::banner-image';
        token.attrs = Object.entries(
            bannerImageAttrs({...attrs, src: normalizeLinkUrl(md, attrs.src)}),
        );
        return true;
    });
    const {rules} = md.renderer;
    rules[bannerImageTokenName] = (tokens, idx, options, _env, self) =>
        tokens[idx].attrGet('src') === null ? '' : self.renderToken(tokens, idx, options);
};
