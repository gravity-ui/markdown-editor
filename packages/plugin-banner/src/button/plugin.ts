import {directiveParser, registerInlineDirective} from '@diplodoc/directive';
import type {InlineDirectiveHandler} from '@diplodoc/directive';
import type MarkdownIt from 'markdown-it';
import type {PluginSimple} from 'markdown-it';
import type {RuleCore} from 'markdown-it/lib/parser_core';
import type {RuleInline} from 'markdown-it/lib/parser_inline';
import type Renderer from 'markdown-it/lib/renderer';
import type Token from 'markdown-it/lib/token';

import {bannerTokenName} from '../banner/const';
import {directiveRawAttrs} from '../directive';

import {buttonAttrs} from './attrs';
import {buttonRowBreakTokenName, buttonRowClassName, buttonTokenName} from './const';
import {normalizeButtonHref} from './utils';

const buttonMarker = `:${buttonTokenName}`;

const bareButton: RuleInline = (state, silent) => {
    const end = state.pos + buttonMarker.length;
    if (!state.src.startsWith(buttonMarker, state.pos) || /[[\w-]/.test(state.src.charAt(end))) {
        return false;
    }
    Object.assign(state, {
        pos: end,
        pending: silent ? state.pending : state.pending + buttonMarker,
    });
    return true;
};

const buttonDirective: InlineDirectiveHandler = (state, params) => {
    if (!params.content || params.dests) return false;
    const label = state.md.utils.unescapeMd(params.content.raw).trim();
    if (!label) return true;
    const attrs = params.attrs ?? {};
    const {href} = directiveRawAttrs(
        state.md,
        state.src.slice(params.content.endPos + 1, params.endPos),
        attrs,
        ['href'],
    );
    const token = state.push(buttonTokenName, 'a', 0);
    token.content = label;
    token.meta = {label};
    token.attrs = Object.entries(
        buttonAttrs({...attrs, href: normalizeButtonHref(state.md, href)}),
    );
    return true;
};

const buttonLinks: RuleCore = (state) => {
    for (const inline of state.tokens) {
        if (inline.type !== 'inline' || !inline.children) continue;
        const children: Token[] = [];
        let link: Token | undefined;
        let reopened = false;
        for (const token of inline.children) {
            if (token.type === 'link_open') {
                link = token;
                reopened = false;
            } else if (token.type === 'link_close') {
                const empty = reopened && children.at(-1) === link;
                link = undefined;
                if (empty) {
                    children.pop();
                    continue;
                }
            } else if (token.type === buttonTokenName && link) {
                if (children.at(-1) === link) children.pop();
                else children.push(new state.Token('link_close', link.tag, -1));
                link = Object.assign(new state.Token('link_open', link.tag, 1), {
                    attrs: link.attrs && [...link.attrs],
                    markup: link.markup,
                    info: link.info,
                });
                reopened = true;
                children.push(token, link);
                continue;
            }
            children.push(token);
        }
        inline.children = children;
    }
};

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

const renderButtonRowBreak: Renderer.RenderRule = (tokens, idx, options, env, self) =>
    `${self.renderInline(tokens[idx].children ?? [], options, env)}\n`;

const renderButton =
    ({utils}: MarkdownIt): Renderer.RenderRule =>
    (tokens, idx, _options, _env, self) => {
        const token = tokens[idx];
        const label = token.meta?.label ?? token.content;
        return `<a${self.renderAttrs(token)}>${utils.escapeHtml(label)}</a>`;
    };

export const buttonPlugin: PluginSimple = (md) => {
    md.use(directiveParser());
    if (!md.inline.ruler.getRules('').includes(bareButton)) {
        md.inline.ruler.before('inline_directive', 'button_bare', bareButton);
    }
    registerInlineDirective(md, buttonTokenName, buttonDirective);
    if (!md.core.ruler.getRules('').includes(buttonRows)) {
        md.core.ruler.after('inline', 'button_row', buttonRows);
        md.core.ruler.before('button_row', 'button_link', buttonLinks);
    }
    const {rules} = md.renderer;
    rules[buttonRowBreakTokenName] = renderButtonRowBreak;
    rules[buttonTokenName] = renderButton(md);
};
