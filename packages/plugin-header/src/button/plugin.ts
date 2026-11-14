import {directiveParser, registerInlineDirective} from '@diplodoc/directive';
import type {PluginSimple} from 'markdown-it';
import type {RuleCore} from 'markdown-it/lib/parser_core';
import type Token from 'markdown-it/lib/token';

import {directiveRawAttr} from '../directive';
import {headerTokenName} from '../header/const';

import {buttonAttrs} from './attrs';
import {buttonRowClassName, buttonTokenName} from './const';
import {normalizeButtonHref} from './utils';

const isSpace = (token: Token) =>
    token.type === 'softbreak' || (token.type === 'text' && !token.content.trim());

/** Buttons and the spaces or line breaks between them, nothing else. */
const isButtonRow = (children: Token[]) =>
    children.some((token) => token.type === buttonTokenName) &&
    children.every((token) => token.type === buttonTokenName || isSpace(token));

/** Buttons without a label render nothing, so their paragraph has no content. */
const isEmptyButtons = ({content, children}: Token) =>
    content.includes(`:${buttonTokenName}[`) && Boolean(children?.every(isSpace));

/** Marks the hidden paragraph that continues a row: it renders as the line break between buttons. */
const rowJoinMeta = 'buttonRowJoin';

/**
 * A paragraph of buttons only is laid out as a row; buttons in running text keep the spaces.
 * Inside a header, rows that follow one another render as one row: the paragraph tags
 * between them are hidden, the tokens stay as parsed. A paragraph of empty buttons is hidden.
 */
const buttonRows: RuleCore = ({tokens}) => {
    let headerDepth = 0;
    let rowClose: Token | undefined;
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
            if (open.type === `${headerTokenName}_open`) headerDepth++;
            if (open.type === `${headerTokenName}_close`) headerDepth--;
            rowClose = undefined;
            continue;
        }
        index += 2;
        if (isEmptyButtons(inline)) {
            open.hidden = true;
            close.hidden = true;
        } else if (isButtonRow(inline.children ?? [])) {
            if (headerDepth > 0 && rowClose) {
                rowClose.hidden = true;
                open.hidden = true;
                open.meta = {...open.meta, [rowJoinMeta]: true};
            } else {
                open.attrJoin('class', buttonRowClassName);
            }
            rowClose = close;
        } else {
            rowClose = undefined;
        }
    }
};

export const buttonPlugin: PluginSimple = (md) => {
    md.use(directiveParser());
    registerInlineDirective(md, buttonTokenName, (state, params) => {
        if (!params.content || params.dests) return false;
        const label = md.utils.unescapeMd(params.content.raw).trim();
        // A button without a label consumes its markup and renders nothing.
        if (!label) return true;
        const attrs = params.attrs ?? {};
        // A repeated attribute is a list of values and counts as unsupported.
        const href =
            typeof attrs.href === 'string'
                ? directiveRawAttr(
                      md,
                      state.src.slice(params.content.endPos + 1, params.endPos),
                      'href',
                  )
                : undefined;
        const token = state.push(buttonTokenName, 'a', 0);
        token.content = label;
        token.attrs = Object.entries(buttonAttrs({...attrs, href: normalizeButtonHref(md, href)}));
        return true;
    });
    // The rule runs once, also when the plugin is used several times.
    if (!md.core.ruler.getRules('').includes(buttonRows)) {
        md.core.ruler.after('inline', 'button_row', buttonRows);
    }
    const {rules} = md.renderer;
    // Whitespace between the buttons of joined paragraphs, as between the buttons of one
    // paragraph: without styles they do not run together.
    const renderParagraphOpen = rules.paragraph_open;
    rules.paragraph_open = (tokens, idx, options, env, self) => {
        if (tokens[idx].meta?.[rowJoinMeta]) return '\n';
        return renderParagraphOpen
            ? renderParagraphOpen(tokens, idx, options, env, self)
            : self.renderToken(tokens, idx, options);
    };
    rules[buttonTokenName] = (tokens, idx, _options, _env, self) => {
        const token = tokens[idx];
        return `<a${self.renderAttrs(token)}>${md.utils.escapeHtml(token.content)}</a>`;
    };
};
