import {directiveParser, registerInlineDirective} from '@diplodoc/directive';
import type {PluginSimple} from 'markdown-it';
import type Token from 'markdown-it/lib/token';

import {directiveRawAttr} from '../directive';

import {buttonAttrs} from './attrs';
import {buttonRowClassName, buttonTokenName} from './const';
import {normalizeButtonHref} from './utils';

/** Buttons and the spaces or line breaks between them, nothing else. */
const isButtonRow = (children: Token[] | null) =>
    Boolean(children?.some((token) => token.type === buttonTokenName)) &&
    Boolean(
        children?.every(
            (token) =>
                token.type === buttonTokenName ||
                token.type === 'softbreak' ||
                (token.type === 'text' && !token.content.trim()),
        ),
    );

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
    // A paragraph of buttons only is laid out as a row; buttons in running text keep the spaces.
    md.core.ruler.after('inline', 'button_row', ({tokens}) => {
        tokens.forEach((token, index) => {
            const open = tokens[index - 1];
            if (
                token.type !== 'inline' ||
                open?.type !== 'paragraph_open' ||
                open.hidden ||
                !isButtonRow(token.children) ||
                open.attrGet('class')?.split(' ').includes(buttonRowClassName)
            ) {
                return;
            }
            open.attrJoin('class', buttonRowClassName);
        });
    });
    const {rules} = md.renderer;
    rules[buttonTokenName] = (tokens, idx, _options, _env, self) => {
        const token = tokens[idx];
        return `<a${self.renderAttrs(token)}>${md.utils.escapeHtml(token.content)}</a>`;
    };
};
