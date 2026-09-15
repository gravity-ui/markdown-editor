import {
    type ContainerDirectiveParams,
    type DirectiveAttrs,
    type LeafBlockDirectiveHandler,
    createBlockInlineToken,
    directiveParser,
    registerContainerDirective,
    registerLeafBlockDirective,
} from '@diplodoc/directive';
import type MarkdownIt from 'markdown-it';
import type StateCore from 'markdown-it/lib/rules_core/state_core';
import type Token from 'markdown-it/lib/token';

import {normalizeHeaderActionAttrs, normalizeHeaderAttrs} from '../attrs';
import {
    HeaderActionAttr,
    HeaderAttr,
    HeaderClassName,
    HeaderNode,
    actionDirectiveName,
    headerDirectiveName,
} from '../const';

const STRUCTURE_RULE = 'header_structure';

const OPEN = {
    header: `${HeaderNode.Header}_open`,
    title: `${HeaderNode.Title}_open`,
    subtitle: `${HeaderNode.Subtitle}_open`,
    actions: `${HeaderNode.Actions}_open`,
    action: `${HeaderNode.Action}_open`,
} as const;

const CLOSE = {
    header: `${HeaderNode.Header}_close`,
    title: `${HeaderNode.Title}_close`,
    subtitle: `${HeaderNode.Subtitle}_close`,
    actions: `${HeaderNode.Actions}_close`,
    action: `${HeaderNode.Action}_close`,
} as const;

function tag(state: StateCore, type: string, name: string, nesting: 1 | -1, className?: string): Token {
    const token = new state.Token(type, name, nesting);
    if (className) token.attrs = [['class', className]];
    return token;
}

function emptyInline(state: StateCore): Token {
    const token = new state.Token('inline', '', 0);
    token.content = '';
    token.children = [];
    return token;
}

/**
 * Директива отдаёт плоский поток: заголовок (inline-контент), параграфы и пары `::action`.
 * Схема требует ровно `title subtitle actions`, поэтому поток раскладывается по слотам:
 * первый параграф становится подзаголовком, все `::action` собираются в контейнер, а лишние
 * блоки выносятся за `header_close`. Ничего не теряется, а инвариант остаётся выразим схемой —
 * значит, репарирующий appendTransaction не нужен.
 */
function structureRule(state: StateCore): void {
    const {tokens} = state;

    for (let i = 0; i < tokens.length; i++) {
        if (tokens[i].type !== OPEN.header) continue;

        const bodyLevel = tokens[i].level + 1;
        let depth = 0;
        let end = i + 1;
        for (; end < tokens.length; end++) {
            if (tokens[end].type === OPEN.header) depth++;
            else if (tokens[end].type === CLOSE.header) {
                if (depth === 0) break;
                depth--;
            }
        }
        if (end >= tokens.length) continue;

        const body = tokens.slice(i + 1, end);
        const title: Token[] = [];
        const actions: Token[] = [];
        const rest: Token[] = [];
        let subtitle: Token | undefined;

        let cursor = 0;
        if (body[cursor]?.type === OPEN.title) {
            while (cursor < body.length && body[cursor].type !== CLOSE.title) title.push(body[cursor++]);
            title.push(body[cursor++]);
        }

        while (cursor < body.length) {
            const token = body[cursor];

            if (token.type === OPEN.action && token.level === bodyLevel) {
                while (cursor < body.length && body[cursor].type !== CLOSE.action) {
                    actions.push(body[cursor++]);
                }
                actions.push(body[cursor++]);
                continue;
            }

            if (!subtitle && token.type === 'paragraph_open' && token.level === bodyLevel) {
                cursor++;
                while (cursor < body.length && body[cursor].type !== 'paragraph_close') {
                    if (body[cursor].type === 'inline') subtitle = body[cursor];
                    cursor++;
                }
                cursor++;
                subtitle ??= emptyInline(state);
                continue;
            }

            rest.push(token);
            cursor++;
        }

        const slots: Token[] = title.length
            ? [...title]
            : [
                  tag(state, OPEN.title, 'div', 1, HeaderClassName.Title),
                  emptyInline(state),
                  tag(state, CLOSE.title, 'div', -1),
              ];

        slots.push(
            tag(state, OPEN.subtitle, 'div', 1, HeaderClassName.Subtitle),
            subtitle ?? emptyInline(state),
            tag(state, CLOSE.subtitle, 'div', -1),
            tag(state, OPEN.actions, 'div', 1, HeaderClassName.Actions),
            ...actions,
            tag(state, CLOSE.actions, 'div', -1),
        );

        tokens.splice(i + 1, end - i - 1, ...slots);

        const closeIdx = i + 1 + slots.length;
        if (rest.length) tokens.splice(closeIdx + 1, 0, ...rest);
        i = closeIdx;
    }
}

const actionHandler: LeafBlockDirectiveHandler = (state, params) => {
    if (!params.inlineContent) return false;

    const {href, variant} = normalizeHeaderActionAttrs({
        ...params.attrs,
        [HeaderActionAttr.Href]: params.attrs?.[HeaderActionAttr.Href] ?? params.dests?.link,
    });

    const open = state.push(OPEN.action, 'a', 1);
    open.attrs = [
        ['class', HeaderClassName.Action],
        ['data-variant', variant],
    ];
    if (href) open.attrs.push(['href', href]);

    createBlockInlineToken(state, params);
    state.push(CLOSE.action, 'a', -1);

    return true;
};

/**
 * Header существует только в директивном синтаксисе, поэтому плагин не гейтится опцией
 * `directiveSyntax` — иначе при дефолтном `'disabled'` блок бы молча не парсился.
 */
export const headerDirective: MarkdownIt.PluginSimple = (md) => {
    md.use(directiveParser());

    registerContainerDirective(md, {
        name: headerDirectiveName,
        match: () => true,
        container: {
            tag: 'div',
            token: HeaderNode.Header,
            attrs: (params: ContainerDirectiveParams) => {
                const attrs = normalizeHeaderAttrs({...params.attrs});
                const result: DirectiveAttrs = {class: HeaderClassName.Header};
                for (const key of Object.values(HeaderAttr)) {
                    result[`data-${key}`] = String(attrs[key]);
                }
                return result;
            },
        },
        inlineContent: {
            tag: 'div',
            token: HeaderNode.Title,
            required: false,
            attrs: {class: HeaderClassName.Title},
        },
    });

    registerLeafBlockDirective(md, actionDirectiveName, actionHandler);

    md.core.ruler.push(STRUCTURE_RULE, structureRule);
};
