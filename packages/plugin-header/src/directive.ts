import {
    type ContainerDirectiveParams,
    directiveParser,
    registerContainerDirective,
    tokenizeBlockContent,
} from '@diplodoc/directive';
import type {PluginSimple} from 'markdown-it';
import type StateBlock from 'markdown-it/lib/rules_block/state_block';
import type Token from 'markdown-it/lib/token';

import {headerClassNames, headerContentClassNames, headerTitleClassNames} from './classname';
import {headerContentTokenName, headerTitleTokenName, headerTokenName} from './const';
import {headerDimensions} from './dimensions';
import {normalizeHeaderTextAttrs, normalizeHeaderTitleAttrs} from './text';

const titleOpen = `${headerTitleTokenName}_open`;
const contentOpen = `${headerContentTokenName}_open`;
/** `parentType` of the direct children of `header`. */
const headerChildParent = `${headerTokenName}-directive`;

const isPlainOpening = ({inlineContent, dests, contentTitle}: ContainerDirectiveParams) =>
    !inlineContent && !dests && !contentTitle;

/** Token types of the direct children of `header` above the current line. */
function previousChildren(state: StateBlock) {
    const types: string[] = [];
    for (let i = state.tokens.length - 1; i >= 0 && state.tokens[i].level >= state.level; i--) {
        const {level, nesting, type} = state.tokens[i];
        if (level === state.level && nesting !== -1) types.push(type);
    }
    return types;
}

/** The title is the first child of `header`; the description is the only one. */
function canOpenSlot(state: StateBlock, open: string) {
    if (String(state.parentType) !== headerChildParent) return false;
    const previous = previousChildren(state);
    return open === titleOpen ? previous.length === 0 : !previous.includes(contentOpen);
}

function hideSlot(token: Token, classNames: (attrs: {hidden: boolean}) => string) {
    token.meta = {...token.meta, hidden: true};
    token.attrSet('class', classNames(token.meta));
}

function tokenizeHeaderContent(
    state: StateBlock,
    content: ContainerDirectiveParams['content'],
    {attrs}: ContainerDirectiveParams,
) {
    const start = state.tokens.length;
    tokenizeBlockContent(state, content, headerChildParent);
    const {title, description} = normalizeHeaderTextAttrs(attrs ?? {});
    for (const token of state.tokens.slice(start)) {
        if (token.level !== state.level) continue;
        if (token.type === titleOpen && !title) hideSlot(token, headerTitleClassNames);
        if (token.type === contentOpen && !description) hideSlot(token, headerContentClassNames);
    }
}

export const headerPlugin: PluginSimple = (md) => {
    md.use(directiveParser());
    registerContainerDirective(md, {
        name: 'header',
        match: isPlainOpening,
        container: {
            tag: 'div',
            token: headerTokenName,
            attrs: ({attrs}) => ({class: headerClassNames(attrs ?? {})}),
            meta: ({attrs}) => headerDimensions(attrs ?? {}),
        },
        contentTokenizer: tokenizeHeaderContent,
    });
    registerContainerDirective(md, {
        name: headerTitleTokenName,
        match: (params, state) => isPlainOpening(params) && canOpenSlot(state, titleOpen),
        container: {
            tag: 'div',
            token: headerTitleTokenName,
            attrs: ({attrs}) => ({class: headerTitleClassNames(attrs ?? {})}),
            meta: ({attrs}) => ({...normalizeHeaderTitleAttrs(attrs ?? {}), hidden: false}),
        },
    });
    registerContainerDirective(md, {
        name: headerContentTokenName,
        match: (params, state) => isPlainOpening(params) && canOpenSlot(state, contentOpen),
        container: {
            tag: 'div',
            token: headerContentTokenName,
            attrs: () => ({class: headerContentClassNames({})}),
            meta: () => ({hidden: false}),
        },
    });
};
