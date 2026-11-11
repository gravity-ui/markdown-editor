import {directiveParser, registerContainerDirective} from '@diplodoc/directive';
import type {PluginSimple} from 'markdown-it';

import {buttonAttrs, buttonTokenName, normalizeButtonHref, normalizeButtonStyle} from './button';

export const buttonPlugin: PluginSimple = (md) => {
    md.use(directiveParser());
    registerContainerDirective(md, buttonTokenName, (state, params) => {
        if (params.inlineContent || params.dests || params.contentTitle) return false;
        const attrs = params.attrs ?? {};
        const token = state.push(buttonTokenName, 'a', 0);
        token.map = [params.startLine, params.endLine];
        token.content = state.getLines(
            params.content.startLine,
            params.content.endLine,
            state.blkIndent,
            true,
        );
        token.attrs = Object.entries(
            buttonAttrs({
                ...normalizeButtonStyle(attrs),
                href: normalizeButtonHref(md, attrs.href),
            }),
        );
        return true;
    });
    const {rules} = md.renderer;
    rules[buttonTokenName] = (tokens, idx, _options, _env, self) => {
        const token = tokens[idx];
        return `<a${self.renderAttrs(token)}>${md.utils.escapeHtml(token.content.trim())}</a>\n`;
    };
};
