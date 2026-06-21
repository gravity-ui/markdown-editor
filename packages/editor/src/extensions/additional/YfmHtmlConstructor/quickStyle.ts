import {quickStyleToCssVarDeclarations, quickStyleToReactVars} from './cssVariables';
import type {HtmlConstructorBorderStyle, HtmlConstructorQuickStyle} from './types';

export const HTML_CONSTRUCTOR_BACKGROUND_COLORS = [
    '#ffffff',
    '#f3f4f6',
    '#e7e9ec',
    '#d6e3ff',
    '#e4dafb',
    '#fad7e6',
    '#fbe2cc',
    '#fbefc6',
    '#d6efde',
    '#cdecec',
] as const;

export const HTML_CONSTRUCTOR_TEXT_COLORS = [
    '',
    '#1c1c20',
    '#8b94a3',
    '#2f6fe0',
    '#7a4fe0',
    '#e34d86',
    '#ec7a1c',
    '#2f9e54',
    '#1aa6a6',
] as const;

export const HTML_CONSTRUCTOR_BORDER_RADIUS = ['', '0', '6px', '12px', '20px', '999px'] as const;

export const HTML_CONSTRUCTOR_BORDER_STYLES: HtmlConstructorBorderStyle[] = [
    'solid',
    'dashed',
    'dotted',
    'none',
];

const isObject = (value: unknown): value is Record<string, unknown> =>
    typeof value === 'object' && value !== null;

const isColor = (value: unknown): value is string =>
    typeof value === 'string' && /^#[0-9a-f]{6}$/i.test(value);

const isBorderRadius = (value: unknown): value is string =>
    typeof value === 'string' &&
    (HTML_CONSTRUCTOR_BORDER_RADIUS as readonly string[]).includes(value);

const isBorderStyle = (value: unknown): value is HtmlConstructorBorderStyle =>
    typeof value === 'string' &&
    HTML_CONSTRUCTOR_BORDER_STYLES.includes(value as HtmlConstructorBorderStyle);

export const normalizeHtmlConstructorQuickStyle = (
    value: unknown,
): HtmlConstructorQuickStyle | undefined => {
    if (!isObject(value)) return undefined;

    const quickStyle: HtmlConstructorQuickStyle = {};

    if (isColor(value.background)) quickStyle.background = value.background;
    if (isColor(value.textColor)) quickStyle.textColor = value.textColor;
    if (isBorderRadius(value.borderRadius)) quickStyle.borderRadius = value.borderRadius;
    if (isBorderStyle(value.borderStyle)) quickStyle.borderStyle = value.borderStyle;

    return Object.keys(quickStyle).length ? quickStyle : undefined;
};

/**
 * Quick styles are serialized as CSS custom properties (the public theming
 * contract) rather than concrete properties, so user themes can react to them.
 * See {@link ./cssVariables}.
 */
export const htmlConstructorQuickStyleToReactStyle = quickStyleToReactVars;

export const htmlConstructorQuickStyleToCss = quickStyleToCssVarDeclarations;
