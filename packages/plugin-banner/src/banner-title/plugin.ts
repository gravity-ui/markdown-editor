import {directiveParser, registerLeafBlockDirective} from '@diplodoc/directive';
import type {PluginSimple} from 'markdown-it';

import {bannerTitleAttrs} from './attrs';
import {bannerTitleTokenName} from './const';

export const bannerTitlePlugin: PluginSimple = (md) => {
    md.use(directiveParser());
    registerLeafBlockDirective(md, bannerTitleTokenName, (state, params) => {
        if (!params.inlineContent || params.dests) return false;
        const token = state.push(bannerTitleTokenName, 'div', 0);
        token.map = [params.startLine, params.endLine];
        token.markup = `::${bannerTitleTokenName}`;
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
