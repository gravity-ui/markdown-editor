import {directiveParser, registerLeafBlockDirective} from '@diplodoc/directive';
import type {PluginSimple} from 'markdown-it';
import type Token from 'markdown-it/lib/token';

import {bannerTokenName} from '../banner/const';

import {bannerTitleAttrs} from './attrs';
import {bannerTitleTokenName} from './model';

/** Whether the block at `level` is in a banner that has a title; ancestors are the only earlier tokens with a lower level. */
function bannerHasTitle(tokens: Token[], level: number) {
    let title = false;
    for (let i = tokens.length - 1; i >= 0; i--) {
        const token = tokens[i];
        if (token.level < level) return title && token.type === `${bannerTokenName}_open`;
        if (token.level === level && token.type === bannerTitleTokenName) title = true;
    }
    return false;
}

export const bannerTitlePlugin: PluginSimple = (md) => {
    md.use(directiveParser());
    registerLeafBlockDirective(md, 'banner-title', (state, params) => {
        if (!params.inlineContent || params.dests || params.contentTitle) return false;
        // A banner holds one title: a second one stays a paragraph.
        if (bannerHasTitle(state.tokens, state.level)) return false;
        const token = state.push(bannerTitleTokenName, 'div', 0);
        token.map = [params.startLine, params.endLine];
        token.markup = '::banner-title';
        token.content = md.utils.unescapeMd(params.inlineContent.raw).trim();
        token.attrs = Object.entries(bannerTitleAttrs(params.attrs ?? {}));
        return true;
    });
    const {rules} = md.renderer;
    rules[bannerTitleTokenName] = (tokens, idx, _options, _env, self) => {
        const token = tokens[idx];
        if (!token.content) return '';
        return `<div${self.renderAttrs(token)}>${md.utils.escapeHtml(token.content)}</div>\n`;
    };
};
