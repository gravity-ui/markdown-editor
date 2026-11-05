import {
    type ContainerDirectiveParams,
    type LeafBlockDirectiveParams,
    directiveParser,
    registerContainerDirective,
    registerLeafBlockDirective,
    tokenizeBlockContent,
} from '@diplodoc/directive';
import type MarkdownIt from 'markdown-it';
import type StateBlock from 'markdown-it/lib/rules_block/state_block';
import type StateCore from 'markdown-it/lib/rules_core/state_core';
import type Token from 'markdown-it/lib/token';

import {
    normalizeHeaderActionAttrs,
    normalizeHeaderAttrs,
    normalizeHeaderImageAttrs,
    normalizeHeaderTitleLevel,
} from '../attrs';
import {
    HEADER_MAX_ACTIONS,
    HeaderClassName,
    HeaderToken,
    headerActionName,
    headerDirectiveName,
    headerImageName,
    headerTokenName,
} from '../const';
import {
    type HeaderAction,
    type HeaderImage,
    headerActionHtml,
    headerHtmlClose,
    headerHtmlOpen,
    headerImageHtml,
    headerTitleHtml,
    toSafeUrl,
} from '../dom';

const BLOCKS = new Set(['paragraph', 'heading', 'blockquote']);
const LEAF_BLOCKS = new Set(['paragraph', 'heading']);
const MARKS = ['strong', 'em', 'ins', 's', 'monospace', 'link', 'mark', 'color'];
const INLINE = new Set([
    'text',
    'softbreak',
    'hardbreak',
    'code_inline',
    'emoji',
    ...MARKS.flatMap((mark) => [`${mark}_open`, `${mark}_close`]),
]);

function* topLevel(tokens: Token[]): Generator<Token[]> {
    for (let i = 0; i < tokens.length; i++) {
        let end = i;
        for (let depth = tokens[i].nesting; depth > 0; ) {
            depth += tokens[++end].nesting;
        }
        yield tokens.slice(i, end + 1);
        i = end;
    }
}

const blockName = (token: Token) => token.type.replace(/_open$/, '');
const inner = (group: Token[]) => group.slice(1, -1);
const wrap = (group: Token[], content: Token[]) =>
    content.length ? [group[0], ...content, group[group.length - 1]] : [];

function filterBlocks(tokens: Token[]): Token[] {
    const result: Token[] = [];
    for (const group of topLevel(tokens)) {
        const [open] = group;
        const name = blockName(open);
        if (open.nesting !== 1 || !BLOCKS.has(name)) continue;
        result.push(...(LEAF_BLOCKS.has(name) ? group : wrap(group, filterBlocks(inner(group)))));
    }
    return result;
}

/** Инлайн разбирается после блоков, поэтому марки фильтруются отдельным правилом. У отброшенной марки остаётся текст. */
function filterInline(state: StateCore) {
    let depth = 0;
    for (const token of state.tokens) {
        if (token.type === `${HeaderToken.Body}_open`) depth++;
        else if (token.type === `${HeaderToken.Body}_close`) depth--;
        else if (depth && token.children) {
            token.children = token.children.filter(({type}) => INLINE.has(type));
        }
    }
}

/**
 * Глубина вложенности обложек при разборе. `state.parentType` для этого не годится:
 * правило `lheading` в markdown-it 13 не восстанавливает его после абзаца.
 */
const depths = new WeakMap<StateBlock, number>();

const isInside = (state: StateBlock) => Boolean(depths.get(state));

function tokenizeInside(state: StateBlock, params: ContainerDirectiveParams) {
    const depth = depths.get(state) ?? 0;
    depths.set(state, depth + 1);
    try {
        tokenizeBlockContent(state, params.content);
    } finally {
        depths.set(state, depth);
    }
}

const topLevelOf = (type: string, tokens: Token[]) =>
    [...topLevel(tokens)].filter(([token]) => token.type === type).map(([token]) => token);

export const headerDirective = (md: MarkdownIt) => {
    md.use(directiveParser());
    md.core.ruler.after('inline', 'header_inline', filterInline);

    const pushLeaf = (state: StateBlock, type: string, params: LeafBlockDirectiveParams) => {
        const token = state.push(type, '', 0);
        token.block = true;
        token.map = [params.startLine, params.endLine];
        return token;
    };

    const pushWrapped = (state: StateBlock, type: string, className: string, content: Token[]) => {
        if (!content.length) return;
        state.push(`${type}_open`, 'div', 1).attrSet('class', className);
        state.tokens.push(...content);
        state.push(`${type}_close`, 'div', -1);
    };

    // Директива блока вне обложки поглощается без вывода.
    registerLeafBlockDirective(md, headerImageName, (state, params) => {
        if (!isInside(state)) return true;
        const image: HeaderImage = {
            ...normalizeHeaderImageAttrs(params.attrs),
            src: toSafeUrl(md.normalizeLink(params.dests?.link ?? '')) ?? '',
            alt: md.utils.unescapeAll(params.inlineContent?.raw ?? ''),
        };
        pushLeaf(state, HeaderToken.Image, params).meta = image;
        return true;
    });

    registerLeafBlockDirective(md, headerActionName, (state, params) => {
        if (!isInside(state)) return true;
        const href = params.dests?.link ?? '';
        const action: HeaderAction = {
            ...normalizeHeaderActionAttrs(params.attrs),
            href: md.validateLink(href) ? md.normalizeLink(href) : '',
            text: md.utils.unescapeAll(params.inlineContent?.raw ?? ''),
        };
        pushLeaf(state, HeaderToken.Action, params).meta = action;
        return true;
    });

    registerContainerDirective(md, headerDirectiveName, (state, params) => {
        const start = state.tokens.length;
        tokenizeInside(state, params);
        const tokens = state.tokens.splice(start);
        const [image] = topLevelOf(HeaderToken.Image, tokens);
        const title = md.utils.unescapeAll(params.inlineContent?.raw ?? '').trim();

        const open = state.push(`${headerTokenName}_open`, 'div', 1);
        open.map = [params.startLine, params.endLine];
        open.meta = normalizeHeaderAttrs(params.attrs);

        state.push(`${HeaderToken.Text}_open`, 'div', 1).attrSet('class', HeaderClassName.Text);
        if (title) {
            const token = state.push(HeaderToken.Title, '', 0);
            token.content = title;
            token.meta = {level: normalizeHeaderTitleLevel(params.attrs)};
        }
        pushWrapped(state, HeaderToken.Body, HeaderClassName.Body, filterBlocks(tokens));
        pushWrapped(
            state,
            HeaderToken.Actions,
            HeaderClassName.Actions,
            topLevelOf(HeaderToken.Action, tokens).slice(0, HEADER_MAX_ACTIONS),
        );
        state.push(`${HeaderToken.Text}_close`, 'div', -1);

        if ((image?.meta as HeaderImage | undefined)?.src) state.tokens.push(image);
        state.push(`${headerTokenName}_close`, 'div', -1);
        return true;
    });

    const rules = md.renderer.rules;
    const escape = md.utils.escapeHtml;
    rules[`${headerTokenName}_open`] = (tokens, idx) => headerHtmlOpen(tokens[idx].meta, escape);
    rules[`${headerTokenName}_close`] = () => headerHtmlClose();
    rules[HeaderToken.Title] = (tokens, idx) =>
        headerTitleHtml(tokens[idx].content, tokens[idx].meta.level, escape);
    rules[HeaderToken.Image] = (tokens, idx) => headerImageHtml(tokens[idx].meta, escape);
    rules[HeaderToken.Action] = (tokens, idx) => headerActionHtml(tokens[idx].meta, escape);
};
