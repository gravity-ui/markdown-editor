import {
    directiveParser,
    registerContainerDirective,
    tokenizeBlockContent,
} from '@diplodoc/directive';
import type MarkdownIt from 'markdown-it';
import type Token from 'markdown-it/lib/token';

import {buttonDirective} from '../../../Button/ButtonSpecs/md';
import {normalizeHeaderAttrs, normalizeHeaderImageAttrs, normalizeHeaderTitleAttrs} from '../attrs';
import {
    HeaderClassName,
    HeaderImageDefaults,
    headerActionsName,
    headerContentName,
    headerImageName,
    headerTitleName,
} from '../const';
import {headerHtmlClose, headerHtmlOpen, mediaDomAttrs, titleDomAttrs} from '../dom';

function groups(tokens: Token[]): Token[][] {
    const result: Token[][] = [];
    for (let start = 0; start < tokens.length; ) {
        let end = start + 1;
        for (let depth = tokens[start].nesting; depth > 0 && end < tokens.length; end++)
            depth += tokens[end].nesting;
        result.push(tokens.slice(start, end));
        start = end;
    }
    return result;
}

export const headerDirective = (md: MarkdownIt) => {
    md.use(directiveParser()).use(buttonDirective);
    const plainSlot = (name: string, className: string) =>
        registerContainerDirective(md, name.replace(/_/g, '-'), (state, params) => {
            if (String(state.parentType) !== 'header-directive') return false;
            const token = state.push(`${name}_open`, 'div', 1);
            token.attrs = Object.entries(normalizeHeaderTitleAttrs(params.attrs ?? {}));
            token.attrSet('class', className);
            state.push('text', '', 0).content = md.utils.unescapeAll(params.content.raw.trim());
            state.push(`${name}_close`, 'div', -1);
            return true;
        });
    plainSlot(headerTitleName, HeaderClassName.Title);
    registerContainerDirective(md, 'header-image', (state, params) => {
        if (String(state.parentType) !== 'header-directive') return false;
        const attrs = normalizeHeaderImageAttrs(params.attrs ?? {});
        const token = state.push(headerImageName, 'div', 0);
        token.attrs = Object.entries(attrs);
        return true;
    });
    registerContainerDirective(md, 'header-content', (state, params) => {
        if (String(state.parentType) !== 'header-directive') return false;
        state.push(`${headerContentName}_open`, 'div', 1).attrSet('class', HeaderClassName.Body);
        const start = state.tokens.length;
        tokenizeBlockContent(state, params.content, 'header-content');
        const blocks = groups(state.tokens.splice(start)).filter(
            ([token]) => token.type === 'paragraph_open' || token.type === 'heading_open',
        );
        for (const block of blocks) state.tokens.push(...block);
        state.push(`${headerContentName}_close`, 'div', -1);
        return true;
    });
    registerContainerDirective(md, 'header', (state, params) => {
        if (
            String(state.parentType) === 'header-directive' ||
            String(state.parentType) === 'header-content'
        )
            return false;
        const open = state.push('header_open', 'div', 1);
        open.attrs = Object.entries(normalizeHeaderAttrs(params.attrs ?? {}));
        open.map = [params.startLine, params.endLine];
        const start = state.tokens.length;
        tokenizeBlockContent(state, params.content, 'header-directive');
        const children = groups(state.tokens.splice(start));
        for (const [name, className] of [
            [headerTitleName, HeaderClassName.Title],
            [headerContentName, HeaderClassName.Body],
        ]) {
            const slot = children.find(([token]) => token.type === `${name}_open`);
            if (slot) state.tokens.push(...slot);
            else {
                state.push(`${name}_open`, 'div', 1).attrSet('class', className);
                state.push(`${name}_close`, 'div', -1);
            }
        }
        state.push(`${headerActionsName}_open`, 'div', 1).attrSet('class', HeaderClassName.Actions);
        for (const button of children.filter(([token]) => token.type === 'button').slice(0, 3))
            state.tokens.push(...button);
        state.push(`${headerActionsName}_close`, 'div', -1);
        const media = children.find(([token]) => token.type === headerImageName);
        if (media) state.tokens.push(...media);
        else state.push(headerImageName, 'div', 0).attrs = Object.entries(HeaderImageDefaults);
        state.push('header_close', 'div', -1);
        return true;
    });
    md.core.ruler.after('inline', 'header-safe-inline', (state) => {
        let inContent = false;
        const allowed = new Set([
            'text',
            'text_special',
            'softbreak',
            'hardbreak',
            'strong_open',
            'strong_close',
            'em_open',
            'em_close',
            's_open',
            's_close',
            'link_open',
            'link_close',
            'code_inline',
            'color_open',
            'color_close',
            'underline_open',
            'underline_close',
            'ins_open',
            'ins_close',
            'u_open',
            'u_close',
            'mark_open',
            'mark_close',
            'sub_open',
            'sub_close',
            'sup_open',
            'sup_close',
        ]);
        for (let index = 0; index < state.tokens.length; index++) {
            const token = state.tokens[index];
            if (token.type === `${headerContentName}_open`) inContent = true;
            else if (token.type === `${headerContentName}_close`) inContent = false;
            else if (inContent && token.children) {
                token.children = token.children.filter((child) => allowed.has(child.type));
                if (
                    !token.children.length &&
                    state.tokens[index - 1]?.type === 'paragraph_open' &&
                    state.tokens[index + 1]?.type === 'paragraph_close'
                ) {
                    state.tokens.splice(index - 1, 3);
                    index -= 2;
                }
            }
        }
    });
    md.renderer.rules[`${headerTitleName}_open`] = (tokens, idx) =>
        `<div${Object.entries(titleDomAttrs(Object.fromEntries(tokens[idx].attrs ?? [])))
            .map(([key, value]) => ` ${key}="${md.utils.escapeHtml(value)}"`)
            .join('')}>`;
    md.renderer.rules[`${headerTitleName}_close`] = () => '</div>';
    md.renderer.rules.header_open = (tokens, idx) =>
        headerHtmlOpen(
            normalizeHeaderAttrs(Object.fromEntries(tokens[idx].attrs ?? [])),
            md.utils.escapeHtml,
        );
    md.renderer.rules.header_close = () => headerHtmlClose();
    md.renderer.rules[headerImageName] = (tokens, idx) => {
        const attrs = normalizeHeaderImageAttrs(Object.fromEntries(tokens[idx].attrs ?? []));
        const dom = mediaDomAttrs(attrs);
        const htmlAttrs = Object.entries(dom)
            .map(([name, value]) => ` ${name}="${md.utils.escapeHtml(value)}"`)
            .join('');
        const src = dom['data-src'];
        return `<div${htmlAttrs}>${src ? `<img class="${HeaderClassName.Image}" src="${md.utils.escapeHtml(src)}" alt="${md.utils.escapeHtml(attrs.alt)}" />` : ''}</div>`;
    };
};
