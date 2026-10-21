import {directiveParser, registerInlineDirective} from '@diplodoc/directive';
import type MarkdownIt from 'markdown-it';

import {
    labelColorDomAttr,
    labelDirectiveName,
    labelNodeName,
    legacyLabelDirectiveName,
} from './const';
import {getLabelDomAttrs, normalizeLabelColor} from './utils';

export const labelPlugin: MarkdownIt.PluginSimple = (md) => {
    md.use(directiveParser());

    for (const name of [labelDirectiveName, legacyLabelDirectiveName]) {
        registerInlineDirective(md, name, (state, params) => {
            const raw = params.content?.raw;
            if (!raw) return false;

            const token = state.push(labelNodeName, '', 0);
            token.block = false;
            token.markup = `:${name}`;
            // markdown-it-directive leaves escape sequences in the caption to the handler
            token.content = md.utils.unescapeAll(raw);
            token.attrSet(labelColorDomAttr, normalizeLabelColor(params.attrs?.color));

            return true;
        });
    }

    // eslint-disable-next-line no-param-reassign
    md.renderer.rules[labelNodeName] = (tokens, idx) => {
        const token = tokens[idx];
        const color = normalizeLabelColor(token.attrGet(labelColorDomAttr));
        const attrs = Object.entries(getLabelDomAttrs(color))
            .map(([name, value]) => `${name}="${md.utils.escapeHtml(value)}"`)
            .join(' ');
        const text = md.utils.escapeHtml(token.content);

        return `<span ${attrs}><span class="g-label__text"><span class="g-label__content">${text}</span></span></span>`;
    };
};
