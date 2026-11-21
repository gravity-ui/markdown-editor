import {directiveParser, registerLeafBlockDirective} from '@diplodoc/directive';
import type {LeafBlockDirectiveHandler} from '@diplodoc/directive';
import type MarkdownIt from 'markdown-it';
import type {PluginSimple} from 'markdown-it';
import type Renderer from 'markdown-it/lib/renderer';

import {bannerTitleAttrs} from './attrs';
import {bannerTitleTokenName} from './const';

const bannerTitleDirective: LeafBlockDirectiveHandler = (state, params) => {
    if (!params.inlineContent || params.dests) return false;
    const token = state.push(bannerTitleTokenName, 'div', 0);
    token.map = [params.startLine, params.endLine];
    token.markup = `::${bannerTitleTokenName}`;
    token.content = state.md.utils.unescapeMd(params.inlineContent.raw).trim();
    token.attrs = Object.entries(bannerTitleAttrs(params.attrs ?? {}));
    return true;
};

const renderBannerTitle =
    ({utils}: MarkdownIt): Renderer.RenderRule =>
    (tokens, idx, _options, _env, self) => {
        const token = tokens[idx];
        if (!token.content) return '';
        return `<div${self.renderAttrs(token)}>${utils.escapeHtml(token.content)}</div>\n`;
    };

export const bannerTitlePlugin: PluginSimple = (md) => {
    md.use(directiveParser());
    registerLeafBlockDirective(md, bannerTitleTokenName, bannerTitleDirective);
    const {rules} = md.renderer;
    rules[bannerTitleTokenName] = renderBannerTitle(md);
};
