import {directiveParser, registerInlineDirective} from '@diplodoc/directive';
import type MarkdownIt from 'markdown-it';

import {dateDirectiveName, dateNodeName} from './const';
import {formatDisplayDate, getDateDomAttrs, isIsoDate} from './utils';

export const datePlugin: MarkdownIt.PluginSimple = (md) => {
    md.use(directiveParser());

    registerInlineDirective(md, dateDirectiveName, (state, params) => {
        const value = params.content?.raw;
        // A directive with another content stays plain text, so the source is not lost.
        if (!isIsoDate(value)) return false;

        const token = state.push(dateNodeName, '', 0);
        token.block = false;
        token.markup = `:${dateDirectiveName}`;
        token.content = value;

        return true;
    });

    // eslint-disable-next-line no-param-reassign
    md.renderer.rules[dateNodeName] = (tokens, idx) => {
        const {content} = tokens[idx];
        const attrs = Object.entries(getDateDomAttrs(content))
            .map(([name, value]) => `${name}="${md.utils.escapeHtml(value)}"`)
            .join(' ');
        const text = md.utils.escapeHtml(formatDisplayDate(content));

        return `<time ${attrs}><span class="g-label__text"><span class="g-label__content">${text}</span></span></time>`;
    };
};
