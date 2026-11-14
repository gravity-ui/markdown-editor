import {directiveParser, registerLeafBlockDirective} from '@diplodoc/directive';
import type {PluginSimple} from 'markdown-it';

import {headerTitleAttrs} from './attrs';
import {headerTitleTokenName} from './const';

export const headerTitlePlugin: PluginSimple = (md) => {
    md.use(directiveParser());
    registerLeafBlockDirective(md, headerTitleTokenName, (state, params) => {
        if (!params.inlineContent || params.dests) return false;
        const token = state.push(headerTitleTokenName, 'div', 0);
        token.block = true;
        token.map = [params.startLine, params.endLine];
        token.markup = `::${headerTitleTokenName}`;
        // The text in the brackets is plain: Markdown in it is not parsed.
        token.content = md.utils.unescapeMd(params.inlineContent.raw).trim();
        token.attrs = Object.entries(headerTitleAttrs(params.attrs ?? {}));
        return true;
    });
    const {rules} = md.renderer;
    rules[headerTitleTokenName] = (tokens, idx, _options, _env, self) => {
        const token = tokens[idx];
        // A title without a text keeps its token and renders nothing.
        if (!token.content) return '';
        return `<div${self.renderAttrs(token)}>${md.utils.escapeHtml(token.content)}</div>\n`;
    };
};
