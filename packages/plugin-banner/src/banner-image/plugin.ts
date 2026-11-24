import {directiveParser, registerLeafBlockDirective} from '@diplodoc/directive';
import type {PluginSimple} from 'markdown-it';
import type Token from 'markdown-it/lib/token';

import {bannerTokenName} from '../banner/const';

import {bannerImageAttrs} from './attrs';
import {bannerImageTokenName} from './model';

/** Whether the next block follows an image in the same banner. */
function afterBannerImage(tokens: readonly Token[]) {
    let depth = 0;
    let image = false;
    for (let index = tokens.length - 1; index >= 0; index--) {
        const {type, nesting} = tokens[index];
        if (nesting < 0) {
            depth++;
        } else if (nesting > 0) {
            if (!depth) return image && type === `${bannerTokenName}_open`;
            depth--;
        } else if (!depth && type === bannerImageTokenName) {
            image = true;
        }
    }
    return false;
}

export const bannerImagePlugin: PluginSimple = (md) => {
    md.use(directiveParser());
    registerLeafBlockDirective(md, 'banner-image', (state, params) => {
        if (params.inlineContent || params.dests || params.contentTitle) return false;
        // A banner has one image: a second one stays text.
        if (afterBannerImage(state.tokens)) return false;
        const token = state.push(bannerImageTokenName, 'img', 0);
        token.map = [params.startLine, params.endLine];
        token.markup = '::banner-image';
        token.attrs = Object.entries(bannerImageAttrs(params.attrs ?? {}));
        return true;
    });
    const {rules} = md.renderer;
    rules[bannerImageTokenName] = (tokens, idx, options, _env, self) =>
        tokens[idx].attrGet('src') === null ? '' : self.renderToken(tokens, idx, options);
};
