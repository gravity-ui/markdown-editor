import {directiveParser, registerLeafBlockDirective} from '@diplodoc/directive';
import type {PluginSimple} from 'markdown-it';
import type Token from 'markdown-it/lib/token';

import {headerTokenName} from '../header/model';

import {headerImageAttrs} from './attrs';
import {headerImageTokenName} from './model';

/** Whether the next block follows an image in the same banner. */
function afterBannerImage(tokens: readonly Token[]) {
    let depth = 0;
    let image = false;
    for (let index = tokens.length - 1; index >= 0; index--) {
        const {type, nesting} = tokens[index];
        if (nesting < 0) {
            depth++;
        } else if (nesting > 0) {
            if (!depth) return image && type === `${headerTokenName}_open`;
            depth--;
        } else if (!depth && type === headerImageTokenName) {
            image = true;
        }
    }
    return false;
}

export const headerImagePlugin: PluginSimple = (md) => {
    md.use(directiveParser());
    registerLeafBlockDirective(md, 'header-image', (state, params) => {
        if (params.inlineContent || params.dests) return false;
        // A banner has one image: a second one stays text.
        if (afterBannerImage(state.tokens)) return false;
        const token = state.push(headerImageTokenName, 'img', 0);
        token.map = [params.startLine, params.endLine];
        token.markup = '::header-image';
        token.attrs = Object.entries(headerImageAttrs(params.attrs ?? {}));
        return true;
    });
    const {rules} = md.renderer;
    rules[headerImageTokenName] = (tokens, idx, options, _env, self) =>
        tokens[idx].attrGet('src') === null ? '' : self.renderToken(tokens, idx, options);
};
