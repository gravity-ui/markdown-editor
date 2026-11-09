import {directiveParser, registerInlineDirective} from '@diplodoc/directive';
import type {PluginSimple} from 'markdown-it';

import {labelAttrs, labelCn} from './classname';
import {normalizeLabelColor} from './colors';
import {
    labelColorAttr,
    labelDirectiveName,
    labelTokenName,
    legacyLabelDirectiveName,
} from './const';

export const labelPlugin: PluginSimple = (md) => {
    md.use(directiveParser());

    for (const name of [labelDirectiveName, legacyLabelDirectiveName]) {
        registerInlineDirective(md, name, (state, params) => {
            // markdown-it-directive leaves escape sequences in the caption to the handler
            const text = md.utils.unescapeAll(params.content?.raw ?? '');
            if (!text.trim()) return false;

            const token = state.push(labelTokenName, '', 0);
            token.markup = `:${name}`;
            token.content = text;
            token.attrSet(labelColorAttr, normalizeLabelColor(params.attrs?.color));

            return true;
        });
    }

    // eslint-disable-next-line no-param-reassign
    md.renderer.rules[labelTokenName] = (tokens, idx) => {
        const token = tokens[idx];
        const attrs = Object.entries(labelAttrs(token.attrGet(labelColorAttr)))
            .map(([name, value]) => `${name}="${md.utils.escapeHtml(value)}"`)
            .join(' ');
        const text = md.utils.escapeHtml(token.content);

        return `<span ${attrs}><span class="${labelCn('text')}">${text}</span></span>`;
    };
};
