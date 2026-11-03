import {registerContainerDirective, tokenizeBlockContent} from '@diplodoc/directive';
import type MarkdownIt from 'markdown-it';
import type StateBlock from 'markdown-it/lib/rules_block/state_block';
import type Token from 'markdown-it/lib/token';

import {parseDirectiveAttrs, stringifyAttrs} from './attrs';
import {headerClassName, headerTokenName} from './dimensions';

export const headerTitleTokenName = 'header-title';
export const headerContentTokenName = 'header-content';
export const headerTitleClassName = `${headerClassName}__title`;
export const headerContentClassName = `${headerClassName}__content`;

export const headerTitleSizes = ['1', '2', '3', '4', '5', '6'] as const;
export const headerTextColors = [
    'auto',
    'gray',
    'yellow',
    'orange',
    'red',
    'green',
    'blue',
    'violet',
] as const;
export type HeaderTitleSize = (typeof headerTitleSizes)[number];
export type HeaderTextColor = (typeof headerTextColors)[number];
export type HeaderTitleAttrs = {size: HeaderTitleSize; color: HeaderTextColor};
/** Visibility of the title and description slots. */
export type HeaderTextAttrs = {title: boolean; description: boolean};

export const headerTitleDefaults: Readonly<HeaderTitleAttrs> = {size: '2', color: 'auto'};
export const headerTextDefaults: Readonly<HeaderTextAttrs> = {title: true, description: true};

const isBoolean = (value: string) => value === 'true' || value === 'false';

export function isHeaderTitleSize(value: unknown): value is HeaderTitleSize {
    return headerTitleSizes.some((size) => size === value);
}

export function isHeaderTextColor(value: unknown): value is HeaderTextColor {
    return headerTextColors.some((color) => color === value);
}

export const headerTextAttrsSchema = {title: isBoolean, description: isBoolean};

export function normalizeHeaderTitleAttrs(attrs: {size?: unknown; color?: unknown}) {
    const size = String(attrs.size);
    return {
        size: isHeaderTitleSize(size) ? size : headerTitleDefaults.size,
        color: isHeaderTextColor(attrs.color) ? attrs.color : headerTitleDefaults.color,
    } satisfies HeaderTitleAttrs;
}

export function normalizeHeaderTextAttrs(attrs: {
    title?: unknown;
    description?: unknown;
}): HeaderTextAttrs {
    return {
        title: attrs.title !== false && attrs.title !== 'false',
        description: attrs.description !== false && attrs.description !== 'false',
    };
}

/** Markup attributes of `header` that differ from the defaults. */
export function headerTextMarkupAttrs(attrs: {title?: unknown; description?: unknown}) {
    const {title, description} = normalizeHeaderTextAttrs(attrs);
    return {
        title: title ? undefined : 'false',
        description: description ? undefined : 'false',
    };
}

export function headerTextDomAttrs(attrs: {
    title?: unknown;
    description?: unknown;
}): Record<string, string> {
    const {title, description} = headerTextMarkupAttrs(attrs);
    return {
        ...(title && {'data-title': title}),
        ...(description && {'data-description': description}),
    };
}

export function headerTitleDomAttrs(attrs: {size?: unknown; color?: unknown}) {
    const {size, color} = normalizeHeaderTitleAttrs(attrs);
    return {
        class: headerTitleClassName,
        'data-size': size,
        ...(color !== headerTitleDefaults.color && {'data-color': color}),
    };
}

export function serializeHeaderTitleOpening(attrs: {size?: unknown; color?: unknown}) {
    return `:::${headerTitleTokenName}${stringifyAttrs(normalizeHeaderTitleAttrs(attrs), headerTitleDefaults)}`;
}

export const headerContentOpening = `:::${headerContentTokenName}`;

/** The body of `header` holds at most one title followed by at most one description. */
export function isHeaderTextBody(tokens: Token[], level: number) {
    const types = tokens.filter((token) => token.level === level).map((token) => token.type);
    const order = [headerTitleTokenName, headerContentTokenName].flatMap((name) => [
        `${name}_open`,
        `${name}_close`,
    ]);
    return types.join() === order.filter((type) => types.includes(type)).join();
}

const slotParents = [headerTitleTokenName, headerContentTokenName];

export function isHeaderSlotParent(parentType: string) {
    return slotParents.includes(parentType);
}

function isInsideHeader(state: StateBlock) {
    return String(state.parentType) === headerTokenName;
}

export function headerText(md: MarkdownIt) {
    registerContainerDirective(md, headerTitleTokenName, (state, params) => {
        if (!isInsideHeader(state)) return false;
        const attrs = parseDirectiveAttrs(params, {
            size: isHeaderTitleSize,
            color: isHeaderTextColor,
        });
        if (!attrs) return false;

        const open = state.push(`${headerTitleTokenName}_open`, 'div', 1);
        open.attrs = Object.entries(headerTitleDomAttrs(attrs));
        open.map = [params.startLine, params.endLine];
        open.markup = ':::';
        tokenizeBlockContent(state, params.content, headerTitleTokenName);
        state.push(`${headerTitleTokenName}_close`, 'div', -1).markup = ':::';
        return true;
    });

    registerContainerDirective(md, headerContentTokenName, (state, params) => {
        if (!isInsideHeader(state)) return false;
        if (!parseDirectiveAttrs(params, {})) return false;

        const open = state.push(`${headerContentTokenName}_open`, 'div', 1);
        open.attrs = [['class', headerContentClassName]];
        open.map = [params.startLine, params.endLine];
        open.markup = ':::';
        tokenizeBlockContent(state, params.content, headerContentTokenName);
        state.push(`${headerContentTokenName}_close`, 'div', -1).markup = ':::';
        return true;
    });
}
