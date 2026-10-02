import {
    directiveParser,
    registerContainerDirective,
    registerLeafBlockDirective,
} from '@diplodoc/directive';
import type MarkdownIt from 'markdown-it';

import {slotsTokenizer} from 'src/utils/directive-slots';

import {normalizeHeaderAttrs} from '../attrs';
import {
    HeaderClassName,
    headerActionsName,
    headerContentName,
    headerDirectiveName,
    headerTitleName,
    headerTokenName,
} from '../const';
import {headerHtmlClose, headerHtmlOpen, renderHeaderAction} from '../dom';

const TITLE_PUNCTUATION = new Set('\\`*_{}[]()#+.!>|~-<');

export const headerDirective = (md: MarkdownIt) => {
    md.use(directiveParser());

    const tokenizeSlots = slotsTokenizer(
        {
            [headerContentName]: ['paragraph_open'],
            [headerActionsName]: ['action'],
        },
        {[headerActionsName]: 2},
    );

    registerLeafBlockDirective(md, 'action', (state, params) => {
        const token = state.push('action', 'a', 0);
        token.map = [params.startLine, params.endLine];
        token.block = true;
        token.content = md.utils.unescapeAll(params.inlineContent?.raw ?? '');
        const href = params.dests?.link ?? '';
        token.attrSet('href', md.validateLink(href) ? md.normalizeLink(href) : '');
        token.attrSet('data-type', params.attrs?.type === 'link' ? 'link' : 'button');
        token.attrSet('data-color', params.attrs?.color === 'brand' ? 'brand' : 'default');
        return true;
    });

    registerContainerDirective(md, {
        name: headerDirectiveName,
        match: () => true,
        container: {
            tag: 'div',
            token: headerTokenName,
            attrs: (params) =>
                Object.fromEntries(
                    Object.entries(normalizeHeaderAttrs(params.attrs ?? {})).map(
                        ([name, value]) => [`data-${name}`, value],
                    ),
                ),
        },
        inlineContent: {
            tag: 'div',
            token: headerTitleName,
            required: false,
            attrs: {class: HeaderClassName.Title},
        },
        contentTokenizer: (state, content, params) => {
            const titleInline = state.tokens[state.tokens.length - 2];
            if (titleInline?.type === 'inline') {
                const raw = params.inlineContent?.raw ?? '';
                titleInline.content = [...raw]
                    .map((char, index) =>
                        TITLE_PUNCTUATION.has(char) && !(char === '#' && raw[index - 1] === '&')
                            ? `&#${char.charCodeAt(0)};`
                            : char,
                    )
                    .join('');
            }
            tokenizeSlots(state, content);
        },
    });

    const rules = md.renderer.rules;
    rules[`${headerTokenName}_open`] = (tokens, idx) =>
        headerHtmlOpen(
            normalizeHeaderAttrs(
                Object.fromEntries(
                    (tokens[idx].attrs ?? []).map(([name, value]) => [
                        name.replace(/^data-/, ''),
                        value,
                    ]),
                ),
            ),
            md.utils.escapeHtml,
        );
    rules[`${headerTokenName}_close`] = () => headerHtmlClose();
    rules.action = (tokens, idx) => renderHeaderAction(tokens[idx], md.utils.escapeHtml);
};
