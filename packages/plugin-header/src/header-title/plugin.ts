import {directiveParser, registerLeafBlockDirective} from '@diplodoc/directive';
import type {PluginSimple} from 'markdown-it';
import type Token from 'markdown-it/lib/token';

import {headerTokenName} from '../header/model';

import {headerTitleAttrs} from './attrs';
import {headerTitleTokenName} from './model';

/** Whether the block at `level` is in a header that has a title; ancestors are the only earlier tokens with a lower level. */
function headerHasTitle(tokens: Token[], level: number) {
    let title = false;
    for (let i = tokens.length - 1; i >= 0; i--) {
        const token = tokens[i];
        if (token.level < level) return title && token.type === `${headerTokenName}_open`;
        if (token.level === level && token.type === headerTitleTokenName) title = true;
    }
    return false;
}

export const headerTitlePlugin: PluginSimple = (md) => {
    md.use(directiveParser());
    registerLeafBlockDirective(md, 'header-title', (state, params) => {
        if (!params.inlineContent || params.dests) return false;
        // A header holds one title: a second one stays a paragraph.
        if (headerHasTitle(state.tokens, state.level)) return false;
        const token = state.push(headerTitleTokenName, 'div', 0);
        token.map = [params.startLine, params.endLine];
        token.markup = '::header-title';
        token.content = md.utils.unescapeMd(params.inlineContent.raw).trim();
        token.attrs = Object.entries(headerTitleAttrs(params.attrs ?? {}));
        return true;
    });
    const {rules} = md.renderer;
    rules[headerTitleTokenName] = (tokens, idx, _options, _env, self) => {
        const token = tokens[idx];
        if (!token.content) return '';
        return `<div${self.renderAttrs(token)}>${md.utils.escapeHtml(token.content)}</div>\n`;
    };
};
