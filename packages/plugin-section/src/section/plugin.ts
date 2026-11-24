import {
    directiveParser,
    registerContainerDirective,
    tokenizeBlockContent,
} from '@diplodoc/directive';
import type {PluginSimple} from 'markdown-it';

import {sectionAttrs, sectionColumnAttrs} from './attrs';
import {
    normalizeColumnSizes,
    sectionColumnContentClassName,
    sectionColumnTokenName,
    sectionMaxColumns,
    sectionTokenName,
} from './model';

const sectionOpen = `${sectionTokenName}_open`;
const sectionClose = `${sectionTokenName}_close`;
const columnOpen = `${sectionColumnTokenName}_open`;
const columnClose = `${sectionColumnTokenName}_close`;

export const sectionPlugin: PluginSimple = (md) => {
    md.use(directiveParser());
    const columnLevels = new WeakMap<Parameters<typeof tokenizeBlockContent>[0], number>();

    registerContainerDirective(md, 'section', (state, params) => {
        const {attrs, content, contentTitle, dests, inlineContent} = params;
        if (contentTitle || dests || inlineContent || columnLevels.has(state)) return false;

        const start = state.tokens.length;
        const line = state.line;
        const open = state.push(sectionOpen, 'div', 1);
        open.map = [params.startLine, params.endLine];
        open.attrs = Object.entries(sectionAttrs(attrs ?? {}));

        const columnLevel = state.level;
        columnLevels.set(state, columnLevel);
        try {
            tokenizeBlockContent(state, content);
        } finally {
            columnLevels.delete(state);
        }

        const directTokens = state.tokens
            .slice(start + 1)
            .filter((token) => token.level === columnLevel);
        const columns = directTokens.filter((token) => token.type === columnOpen);
        if (
            columns.length === 0 ||
            columns.length > sectionMaxColumns ||
            directTokens.some((token) => token.type !== columnOpen && token.type !== columnClose)
        ) {
            state.tokens.splice(start);
            Object.assign(state, {level: open.level, line});
            return false;
        }

        const sizes = normalizeColumnSizes(
            columns.map((token) => Number(token.attrGet('data-size'))),
        );
        columns.forEach((token, index) => {
            const normalized = sectionColumnAttrs({
                size: sizes[index],
                background: token.attrGet('data-background'),
            });
            Object.entries(normalized).forEach(([name, value]) => token.attrSet(name, value));
        });
        state.push(sectionClose, 'div', -1);
        return true;
    });

    registerContainerDirective(md, 'column', (state, params) => {
        const {attrs, content, contentTitle, dests, inlineContent} = params;
        if (columnLevels.get(state) !== state.level || contentTitle || dests || inlineContent) {
            return false;
        }

        const open = state.push(columnOpen, 'div', 1);
        open.map = [params.startLine, params.endLine];
        open.attrSet('data-size', attrs?.size ?? '');
        open.attrSet('data-background', attrs?.background ?? '');
        tokenizeBlockContent(state, content);
        state.push(columnClose, 'div', -1);
        return true;
    });

    const {rules} = md.renderer;
    rules[columnOpen] = (tokens, index, options, _env, renderer) =>
        renderer.renderToken(tokens, index, options) +
        `<div class="${sectionColumnContentClassName}">\n`;
    rules[columnClose] = (tokens, index, options, _env, renderer) =>
        '</div>\n' + renderer.renderToken(tokens, index, options);
};
