import {directiveParser, registerInlineDirective} from '@diplodoc/directive';
import type MarkdownIt from 'markdown-it';

import {statusColorDomAttr, statusDirectiveName, statusNodeName} from './const';
import {getStatusDomAttrs, normalizeStatusColor} from './utils';

export const statusPlugin: MarkdownIt.PluginSimple = (md) => {
    md.use(directiveParser());

    registerInlineDirective(md, statusDirectiveName, (state, params) => {
        const raw = params.content?.raw;
        if (!raw) return false;

        const token = state.push(statusNodeName, '', 0);
        token.block = false;
        token.markup = `:${statusDirectiveName}`;
        // markdown-it-directive leaves escape sequences in the caption to the handler
        token.content = md.utils.unescapeAll(raw);
        token.attrSet(statusColorDomAttr, normalizeStatusColor(params.attrs?.color));

        return true;
    });

    // eslint-disable-next-line no-param-reassign
    md.renderer.rules[statusNodeName] = (tokens, idx) => {
        const token = tokens[idx];
        const color = normalizeStatusColor(token.attrGet(statusColorDomAttr));
        const attrs = Object.entries(getStatusDomAttrs(color))
            .map(([name, value]) => `${name}="${md.utils.escapeHtml(value)}"`)
            .join(' ');

        return `<span ${attrs}>${md.utils.escapeHtml(token.content)}</span>`;
    };
};
