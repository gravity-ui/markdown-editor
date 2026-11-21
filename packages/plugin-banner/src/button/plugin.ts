import {directiveParser, registerInlineDirective} from '@diplodoc/directive';
import type {PluginSimple} from 'markdown-it';
import type {RuleCore} from 'markdown-it/lib/parser_core';
import type Token from 'markdown-it/lib/token';

import {bannerTokenName} from '../banner/const';
import {directiveRawAttrs} from '../directive';

import {buttonAttrs} from './attrs';
import {buttonRowBreakTokenName, buttonRowClassName, buttonTokenName} from './const';
import {normalizeButtonHref} from './utils';

const isSpace = (token: Token) =>
    token.type === 'softbreak' || (token.type === 'text' && !token.content.trim());

const isButtonRow = (children: Token[]) =>
    children.some((token) => token.type === buttonTokenName) &&
    children.every((token) => token.type === buttonTokenName || isSpace(token));

const isEmptyButtons = ({content, children}: Token) =>
    content.includes(`:${buttonTokenName}[`) && Boolean(children?.every(isSpace));

const buttonRows: RuleCore = (state) => {
    const {tokens} = state;
    let bannerDepth = 0;
    let row: {inline: Token; close: number} | undefined;
    for (let index = 0; index < tokens.length; index++) {
        const open = tokens[index];
        const inline = tokens[index + 1];
        const close = tokens[index + 2];
        if (
            open.type !== 'paragraph_open' ||
            open.hidden ||
            inline?.type !== 'inline' ||
            close?.type !== 'paragraph_close'
        ) {
            if (open.type === `${bannerTokenName}_open`) bannerDepth++;
            if (open.type === `${bannerTokenName}_close`) bannerDepth--;
            row = undefined;
            continue;
        }
        if (isEmptyButtons(inline)) {
            open.hidden = true;
            close.hidden = true;
            index += 2;
        } else if (!isButtonRow(inline.children ?? [])) {
            row = undefined;
            index += 2;
        } else if (bannerDepth > 0 && row) {
            const rowBreak = new state.Token(buttonRowBreakTokenName, '', 0);
            rowBreak.children = tokens
                .splice(row.close, index + 2 - row.close)
                .flatMap((token) =>
                    token.type === 'inline' && token !== inline ? (token.children ?? []) : [],
                );
            row.inline.children?.push(rowBreak, ...(inline.children ?? []));
            index = row.close;
        } else {
            open.attrJoin('class', buttonRowClassName);
            index += 2;
            row = {inline, close: index};
        }
    }
};

export const buttonPlugin: PluginSimple = (md) => {
    md.use(directiveParser());
    registerInlineDirective(md, buttonTokenName, (state, params) => {
        if (!params.content || params.dests) return false;
        const label = md.utils.unescapeMd(params.content.raw).trim();
        if (!label) return true;
        const attrs = params.attrs ?? {};
        const {href} = directiveRawAttrs(
            md,
            state.src.slice(params.content.endPos + 1, params.endPos),
            attrs,
            ['href'],
        );
        const token = state.push(buttonTokenName, 'a', 0);
        token.content = label;
        token.meta = {label};
        token.attrs = Object.entries(buttonAttrs({...attrs, href: normalizeButtonHref(md, href)}));
        return true;
    });
    if (!md.core.ruler.getRules('').includes(buttonRows)) {
        md.core.ruler.after('inline', 'button_row', buttonRows);
    }
    const {rules} = md.renderer;
    rules[buttonRowBreakTokenName] = (tokens, idx, options, env, self) =>
        `${self.renderInline(tokens[idx].children ?? [], options, env)}\n`;
    rules[buttonTokenName] = (tokens, idx, _options, _env, self) => {
        const token = tokens[idx];
        const label = token.meta?.label ?? token.content;
        return `<a${self.renderAttrs(token)}>${md.utils.escapeHtml(label)}</a>`;
    };
};
