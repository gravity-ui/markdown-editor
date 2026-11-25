import {directiveParser, registerInlineDirective} from '@diplodoc/directive';
import type {PluginSimple} from 'markdown-it';
import type {RuleCore} from 'markdown-it/lib/parser_core';
import type {RuleInline} from 'markdown-it/lib/parser_inline';
import type Renderer from 'markdown-it/lib/renderer';
import type Token from 'markdown-it/lib/token';

import {bannerTokenName} from '../banner/const';
import {normalizeLinkUrl} from '../url';

import {buttonAttrs} from './attrs';
import {buttonRowBreakTokenName, buttonRowClassName, buttonTokenName} from './const';

const buttonDirectiveName = 'button';
const buttonMarker = `:${buttonDirectiveName}`;

// markdown-it-directive 2.0.6 reads the label of `:button` without `[` up to a later `]`
// and breaks `[Press the :button now](/help)`, so a bare `:button` stays text:
// https://github.com/hilookas/markdown-it-directive/issues/16
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
        if (!isButtonRow(inline.children ?? [])) {
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

export const buttonPlugin: PluginSimple = (md) => {
    md.use(directiveParser());
    if (!md.inline.ruler.getRules('').includes(bareButton)) {
        md.inline.ruler.before('inline_directive', 'g_md_button_bare', bareButton);
    }
    registerInlineDirective(md, buttonDirectiveName, (state, {content, dests, attrs}) => {
        const label = md.utils.unescapeMd(content?.raw ?? '').trim();
        const token = state.push(buttonTokenName, 'a', 0);
        token.content = label;
        // A later rule may change `content`, such as markdown-it-attrs reading a trailing `{…}`.
        token.meta = {label};
        token.attrs = Object.entries(
            buttonAttrs({...attrs, href: normalizeLinkUrl(md, dests?.link), title: dests?.string}),
        );
        return true;
    });
    if (!md.core.ruler.getRules('').includes(buttonRows)) {
        md.core.ruler.after('inline', 'g_md_button_row', buttonRows);
        md.core.ruler.before('g_md_button_row', 'g_md_button_link', buttonLinks);
    }
    const {rules} = md.renderer;
    rules[buttonRowBreakTokenName] = renderButtonRowBreak;
    rules[buttonTokenName] = (tokens, idx, _options, _env, self) => {
        const token = tokens[idx];
        const label = token.meta?.label ?? token.content;
        return `<a${self.renderAttrs(token)}>${md.utils.escapeHtml(label)}</a>`;
    };
};
