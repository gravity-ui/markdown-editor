import {directiveParser, registerContainerDirective} from '@diplodoc/directive';
import type MarkdownIt from 'markdown-it';

import {buttonDomAttrs, normalizeButtonAttrs} from './attrs';

const configured = new WeakSet<MarkdownIt>();

export const buttonDirective = (md: MarkdownIt) => {
    if (configured.has(md)) return;
    configured.add(md);
    md.use(directiveParser());
    registerContainerDirective(md, 'button', (state, params) => {
        const attrs = normalizeButtonAttrs({
            ...params.attrs,
            label: md.utils.unescapeAll(params.content.raw.trim()),
        });
        const token = state.push('button', 'a', 0);
        token.block = true;
        token.map = [params.startLine, params.endLine];
        token.content = attrs.label;
        token.attrs = Object.entries(attrs).map(([key, value]) => [key, String(value)]);
        return true;
    });
    md.renderer.rules.button = (tokens, idx) => {
        const token = tokens[idx];
        const attrs = buttonDomAttrs(Object.fromEntries(token.attrs ?? []));
        const htmlAttrs = Object.entries(attrs)
            .map(([key, value]) => ` ${key}="${md.utils.escapeHtml(value)}"`)
            .join('');
        return `<a${htmlAttrs}>${md.utils.escapeHtml(token.content)}</a>`;
    };
};
