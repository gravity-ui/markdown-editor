import {directiveParser, registerLeafBlockDirective} from '@diplodoc/directive';
import type MarkdownIt from 'markdown-it';

import {
    buttonActionDomAttrs,
    buttonColorDataAttr,
    buttonViewDataAttr,
    normalizeButtonStyle,
} from './attrs';
import {ButtonAttr, buttonClassName, buttonDirectiveName, buttonTokenName} from './const';

export const buttonDirective = (md: MarkdownIt) => {
    const {escapeHtml, unescapeAll} = md.utils;

    md.use(directiveParser());

    registerLeafBlockDirective(
        md,
        buttonDirectiveName,
        (state, {attrs, inlineContent, dests, startLine, endLine}) => {
            const href = dests?.link ?? '';
            const style = normalizeButtonStyle(attrs?.[ButtonAttr.View], attrs?.[ButtonAttr.Color]);
            const token = state.push(buttonTokenName, 'div', 0);
            token.block = true;
            token.map = [startLine, endLine];
            token.content = unescapeAll(inlineContent?.raw ?? '');
            token.attrs = [
                [ButtonAttr.Href, md.validateLink(href) ? href : ''],
                [buttonViewDataAttr, style.view],
                [buttonColorDataAttr, style.color],
            ];
            return true;
        },
    );

    md.renderer.rules[buttonTokenName] = (tokens, idx) => {
        const token = tokens[idx];
        const style = normalizeButtonStyle(
            token.attrGet(buttonViewDataAttr),
            token.attrGet(buttonColorDataAttr),
        );
        const attrs = Object.entries({
            ...buttonActionDomAttrs(style),
            href: md.normalizeLink(token.attrGet(ButtonAttr.Href) ?? ''),
        })
            .map(([name, value]) => ` ${name}="${escapeHtml(value)}"`)
            .join('');
        return `<div class="${buttonClassName}"><a${attrs}>${escapeHtml(token.content)}</a></div>\n`;
    };
};
