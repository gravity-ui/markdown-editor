import {directiveParser, registerInlineDirective} from '@diplodoc/directive';
import type {PluginSimple} from 'markdown-it';
import type {RuleCore} from 'markdown-it/lib/parser_core';
import type Token from 'markdown-it/lib/token';

import {buttonAttrs} from './attrs';
import {buttonRowClassName, buttonTokenName, normalizeButtonHref} from './model';

const isSpace = (token: Token) =>
    token.type === 'softbreak' || (token.type === 'text' && !token.content.trim());

const isButtonRow = (children: Token[]) =>
    children.some((token) => token.type === buttonTokenName) &&
    children.every((token) => token.type === buttonTokenName || isSpace(token));

// Buttons without labels leave no tokens.
const isEmptyButtons = ({content, children}: Token) =>
    content.includes(`:${buttonTokenName}[`) && Boolean(children?.every(isSpace));

const buttonRows: RuleCore = ({tokens}) => {
    for (let index = 0; index < tokens.length - 2; index++) {
        const open = tokens[index];
        const inline = tokens[index + 1];
        const close = tokens[index + 2];
        if (
            open.type !== 'paragraph_open' ||
            open.hidden ||
            inline.type !== 'inline' ||
            close.type !== 'paragraph_close'
        ) {
            continue;
        }
        if (isEmptyButtons(inline)) {
            open.hidden = true;
            close.hidden = true;
        } else if (isButtonRow(inline.children ?? [])) {
            open.attrJoin('class', buttonRowClassName);
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
        const token = state.push(buttonTokenName, 'a', 0);
        token.content = label;
        token.attrs = Object.entries(
            buttonAttrs({...attrs, href: normalizeButtonHref(md, attrs.href)}),
        );
        return true;
    });
    if (!md.core.ruler.getRules('').includes(buttonRows)) {
        md.core.ruler.after('inline', 'button_row', buttonRows);
    }
    const {rules} = md.renderer;
    rules[buttonTokenName] = (tokens, idx, _options, _env, self) => {
        const token = tokens[idx];
        return `<a${self.renderAttrs(token)}>${md.utils.escapeHtml(token.content)}</a>`;
    };
};
