import {
    type ContainerDirectiveHandler,
    directiveParser,
    registerContainerDirective,
} from '@diplodoc/directive';
import type MarkdownIt from 'markdown-it';
import type StateBlock from 'markdown-it/lib/rules_block/state_block';
import type Token from 'markdown-it/lib/token';

import {normalizeHeaderAttrs} from '../attrs';
import {
    HeaderActionAttr,
    HeaderAttr,
    HeaderClassName,
    HeaderNode,
    headerDirectiveName,
} from '../const';
import {type HeaderActionData, parseHeaderContent} from '../content';

function openHeader(state: StateBlock, params: Parameters<ContainerDirectiveHandler>[1]): void {
    const attrs = normalizeHeaderAttrs({...params.attrs});
    const token = state.push(`${HeaderNode.Header}_open`, 'div', 1);
    token.block = true;
    token.map = [params.startLine, params.endLine];
    token.attrs = [['class', HeaderClassName.Header]];
    for (const key of Object.values(HeaderAttr)) {
        token.attrs.push([`data-${key}`, String(attrs[key])]);
    }
}

/**
 * Текст слота едет в `content` одного токена, а не в `inline`: `inline` ядро markdown-it
 * разбирает как markdown, а в этом блоке форматирования нет — `**жирный**` должен остаться
 * такими же семью символами, какими его написали в yaml.
 */
function pushText(state: StateBlock, type: string, tag: string, content: string): Token {
    const token = state.push(type, tag, 0);
    token.block = true;
    token.content = content;
    return token;
}

function pushAction(state: StateBlock, action: HeaderActionData): void {
    const token = pushText(state, HeaderNode.Action, 'a', action.title);
    token.attrs = [
        ['class', HeaderClassName.Action],
        [`data-${HeaderActionAttr.Type}`, action.type],
    ];
    if (action.href) token.attrs.push([HeaderActionAttr.Href, action.href]);
}

const headerHandler: ContainerDirectiveHandler = (state, params) => {
    const content = parseHeaderContent(params.content?.raw ?? '');

    openHeader(state, params);

    pushText(state, HeaderNode.Title, 'div', content.title).attrs = [
        ['class', HeaderClassName.Title],
    ];
    pushText(state, HeaderNode.Description, 'div', content.description).attrs = [
        ['class', HeaderClassName.Description],
    ];

    const actionsOpen = state.push(`${HeaderNode.Actions}_open`, 'div', 1);
    actionsOpen.block = true;
    actionsOpen.attrs = [['class', HeaderClassName.Actions]];
    content.actions.forEach((action) => pushAction(state, action));
    state.push(`${HeaderNode.Actions}_close`, 'div', -1).block = true;

    state.push(`${HeaderNode.Header}_close`, 'div', -1).block = true;

    return true;
};

/** Слоты — не inline-токены, поэтому их текст надо отрисовать самому, иначе в html пустые теги. */
function renderTextToken(this: void, tokens: Token[], idx: number, md: MarkdownIt): string {
    const token = tokens[idx];
    const attrs = (token.attrs ?? [])
        .map(([name, value]) => ` ${name}="${md.utils.escapeHtml(value)}"`)
        .join('');
    return `<${token.tag}${attrs}>${md.utils.escapeHtml(token.content)}</${token.tag}>`;
}

/**
 * Header существует только в директивном синтаксисе, поэтому плагин не гейтится опцией
 * `directiveSyntax` — иначе при дефолтном `'disabled'` блок бы молча не парсился.
 */
export const headerDirective: MarkdownIt.PluginSimple = (md) => {
    md.use(directiveParser());

    registerContainerDirective(md, headerDirectiveName, headerHandler);

    for (const type of [HeaderNode.Title, HeaderNode.Description, HeaderNode.Action]) {
        md.renderer.rules[type] = (tokens, idx) => renderTextToken(tokens, idx, md);
    }
};
