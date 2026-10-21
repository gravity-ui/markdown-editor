import {directiveParser, registerLeafBlockDirective} from '@diplodoc/directive';
import type MarkdownIt from 'markdown-it';

import {buttonActionClassName, buttonClassName, buttonDirectiveName, buttonTokenName} from './const';

export const buttonDirective = (md: MarkdownIt) => {
    const {escapeHtml, unescapeAll} = md.utils;

    md.use(directiveParser());

    registerLeafBlockDirective(
        md,
        buttonDirectiveName,
        (state, {inlineContent, dests, startLine, endLine}) => {
            const href = dests?.link ?? '';
            const token = state.push(buttonTokenName, 'div', 0);
            token.block = true;
            token.map = [startLine, endLine];
            token.content = unescapeAll(inlineContent?.raw ?? '');
            token.attrSet('href', md.validateLink(href) ? href : '');
            return true;
        },
    );

    md.renderer.rules[buttonTokenName] = (tokens, idx) => {
        const token = tokens[idx];
        const href = escapeHtml(md.normalizeLink(token.attrGet('href') ?? ''));
        const label = escapeHtml(token.content);
        return `<div class="${buttonClassName}"><a class="${buttonActionClassName}" href="${href}">${label}</a></div>\n`;
    };
};
