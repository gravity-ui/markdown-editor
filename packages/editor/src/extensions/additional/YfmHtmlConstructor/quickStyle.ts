import {quickStyleToCssVarDeclarations, quickStyleToReactVars} from './cssVariables';
import type {
    HtmlConstructorBorderStyle,
    HtmlConstructorColorTheme,
    HtmlConstructorQuickStyle,
    HtmlConstructorThemedColor,
} from './types';

export const HTML_CONSTRUCTOR_BACKGROUND_COLORS = [
    // Saturated row
    '#d64545',
    '#ec7a1c',
    '#efb008',
    '#2f9e54',
    '#1aa6a6',
    '#2f6fe0',
    '#7a4fe0',
    '#e34d86',
    '#8b94a3',
    '#1c1c20',
    // Light row
    '#f6d6d6',
    '#fbe2cc',
    '#fbefc6',
    '#d6efde',
    '#cdecec',
    '#d6e3ff',
    '#e4dafb',
    '#fad7e6',
    '#e7e9ec',
    '#ffffff',
] as const;

export const HTML_CONSTRUCTOR_TEXT_COLORS = [
    '',
    '#d64545',
    '#ec7a1c',
    '#efb008',
    '#2f9e54',
    '#1aa6a6',
    '#2f6fe0',
    '#7a4fe0',
    '#e34d86',
    '#8b94a3',
    '#1c1c20',
    '#ffffff',
] as const;

/**
 * Maps a palette color to an i18n key with its human-readable name, shown as the
 * swatch tooltip. Keep in sync with the keysets in `src/i18n/yfm-html-constructor`.
 */
export const HTML_CONSTRUCTOR_COLOR_NAME_KEYS: Record<string, string> = {
    '#d64545': 'color_red',
    '#ec7a1c': 'color_orange',
    '#efb008': 'color_yellow',
    '#2f9e54': 'color_green',
    '#1aa6a6': 'color_teal',
    '#2f6fe0': 'color_blue',
    '#7a4fe0': 'color_purple',
    '#e34d86': 'color_pink',
    '#8b94a3': 'color_gray',
    '#1c1c20': 'color_black',
    '#ffffff': 'color_white',
    '#f6d6d6': 'color_red_light',
    '#fbe2cc': 'color_orange_light',
    '#fbefc6': 'color_yellow_light',
    '#d6efde': 'color_green_light',
    '#cdecec': 'color_teal_light',
    '#d6e3ff': 'color_blue_light',
    '#e4dafb': 'color_purple_light',
    '#fad7e6': 'color_pink_light',
    '#e7e9ec': 'color_gray_light',
};

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

/**
 * Accepts the themed `{light?, dark?}` shape and, for backward compatibility,
 * a bare color string from before colors were theme-aware (applied to both).
 */
const normalizeThemedColor = (value: unknown): HtmlConstructorThemedColor | undefined => {
    if (isColor(value)) return {light: value, dark: value};

    if (!isObject(value)) return undefined;

    const themed: HtmlConstructorThemedColor = {};
    if (isColor(value.light)) themed.light = value.light;
    if (isColor(value.dark)) themed.dark = value.dark;

    return themed.light || themed.dark ? themed : undefined;
};

export const normalizeHtmlConstructorQuickStyle = (
    value: unknown,
): HtmlConstructorQuickStyle | undefined => {
    if (!isObject(value)) return undefined;

    const quickStyle: HtmlConstructorQuickStyle = {};

    const background = normalizeThemedColor(value.background);
    const textColor = normalizeThemedColor(value.textColor);
    if (background) quickStyle.background = background;
    if (textColor) quickStyle.textColor = textColor;
    if (isBorderRadius(value.borderRadius)) quickStyle.borderRadius = value.borderRadius;
    if (isBorderStyle(value.borderStyle)) quickStyle.borderStyle = value.borderStyle;

    return Object.keys(quickStyle).length ? quickStyle : undefined;
};

/**
 * Returns a themed color with `color` set (or cleared) for the given theme,
 * or `undefined` when neither side remains — ready to drop the whole entry.
 */
export const setThemedColor = (
    current: HtmlConstructorThemedColor | undefined,
    theme: HtmlConstructorColorTheme,
    color: string | undefined,
): HtmlConstructorThemedColor | undefined => {
    const next: HtmlConstructorThemedColor = {...current};

    if (color) {
        next[theme] = color;
    } else {
        delete next[theme];
    }

    return next.light || next.dark ? next : undefined;
};

/**
 * Quick styles are serialized as CSS custom properties (the public theming
 * contract) rather than concrete properties, so user themes can react to them.
 * See {@link ./cssVariables}.
 */
export const htmlConstructorQuickStyleToReactStyle = quickStyleToReactVars;

export const htmlConstructorQuickStyleToCss = quickStyleToCssVarDeclarations;
