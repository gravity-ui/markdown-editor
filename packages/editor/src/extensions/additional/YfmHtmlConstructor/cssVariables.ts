import type {CSSProperties} from 'react';

import {htmlConstructorBlockClass, htmlConstructorStructureClass} from './css';
import type {HtmlConstructorBorderStyle, HtmlConstructorQuickStyle} from './types';

/**
 * Public CSS custom properties that connect the block toolbar's quick-style
 * controls to user-authored themes.
 *
 * For every styleable aspect there are four properties:
 *   --g-md-hc-<name>          – the active value the block consumes
 *   --g-md-hc-<name>-light    – value a theme sets for the light color theme
 *   --g-md-hc-<name>-dark     – value a theme sets for the dark color theme
 *   --g-md-hc-<name>-current  – internal: the light/dark value resolved for the
 *                               active theme (set by {@link HTML_CONSTRUCTOR_VARIABLES_CSS})
 *
 * The block resolves each property as a chain:
 *   quick-style override (inline --g-md-hc-<name>)
 *     -> theme value for the active color theme (--g-md-hc-<name>-current)
 *       -> the constructor's own theme-aware default ({@link HTML_CONSTRUCTOR_DEFAULTS}).
 *
 * Colors are theme-aware: the toolbar writes the light/dark companions
 * (--g-md-hc-<name>-light / -dark), overriding the template's own companions, so
 * `-current` resolves a different color per active theme. Border radius and
 * border are theme-agnostic and still write the single override variable.
 *
 * Templates no longer need to hardcode default colors: when nothing is set the
 * constructor supplies the defaults below, which are built from Gravity UI
 * semantic tokens that already adapt to the active light/dark theme.
 */
export const HTML_CONSTRUCTOR_CSS_VARS = {
    backgroundLight: '--g-md-hc-background-light',
    backgroundDark: '--g-md-hc-background-dark',
    textColorLight: '--g-md-hc-text-color-light',
    textColorDark: '--g-md-hc-text-color-dark',
    borderRadius: '--g-md-hc-border-radius',
    border: '--g-md-hc-border',
} as const;

/**
 * Theme-aware defaults the constructor (the container) bakes into the
 * `-current` variables when neither a quick-style override nor a
 * template/theme companion sets a value. They lean on Gravity UI semantic
 * tokens, which already flip with the active theme.
 *
 * Because the defaults live on the container, templates never hardcode default
 * colors: they just read `var(--g-md-hc-<name>, var(--g-md-hc-<name>-current))`
 * and inherit the resolved value (override -> theme companion -> this default).
 */
export const HTML_CONSTRUCTOR_DEFAULTS = {
    background: 'var(--g-color-base-generic-ultralight)',
    textColor: 'var(--g-color-text-primary)',
    border: '1px solid var(--g-color-line-generic)',
    borderRadius: 'var(--g-border-radius-l)',
} as const;

const borderToValue = (style: HtmlConstructorBorderStyle): string =>
    style === 'none' ? 'none' : `1px ${style} var(--g-color-line-generic)`;

/** Maps a quick-style selection onto the public override CSS variables. */
export const quickStyleToCssVars = (
    quickStyle: HtmlConstructorQuickStyle | undefined,
): Record<string, string> => {
    const vars: Record<string, string> = {};
    if (!quickStyle) return vars;

    if (quickStyle.background?.light) {
        vars[HTML_CONSTRUCTOR_CSS_VARS.backgroundLight] = quickStyle.background.light;
    }
    if (quickStyle.background?.dark) {
        vars[HTML_CONSTRUCTOR_CSS_VARS.backgroundDark] = quickStyle.background.dark;
    }
    if (quickStyle.textColor?.light) {
        vars[HTML_CONSTRUCTOR_CSS_VARS.textColorLight] = quickStyle.textColor.light;
    }
    if (quickStyle.textColor?.dark) {
        vars[HTML_CONSTRUCTOR_CSS_VARS.textColorDark] = quickStyle.textColor.dark;
    }
    if (quickStyle.borderRadius) {
        vars[HTML_CONSTRUCTOR_CSS_VARS.borderRadius] = quickStyle.borderRadius;
    }
    if (quickStyle.borderStyle) {
        vars[HTML_CONSTRUCTOR_CSS_VARS.border] = borderToValue(quickStyle.borderStyle);
    }

    return vars;
};

export const quickStyleToReactVars = (
    quickStyle: HtmlConstructorQuickStyle | undefined,
): CSSProperties | undefined => {
    const vars = quickStyleToCssVars(quickStyle);
    return Object.keys(vars).length ? (vars as CSSProperties) : undefined;
};

export const quickStyleToCssVarDeclarations = (
    quickStyle: HtmlConstructorQuickStyle | undefined,
): string => {
    const declarations = Object.entries(quickStyleToCssVars(quickStyle)).map(
        ([name, value]) => `${name}: ${value}`,
    );
    return declarations.length ? `${declarations.join('; ')};` : '';
};

const STRUCTURE = `.${htmlConstructorStructureClass}`;
const BLOCK = `.${htmlConstructorBlockClass}`;
const DARK_ROOTS = ['.g-root_theme_dark', '.g-root_theme_dark-hc'];

/**
 * Resolves each `-current` variable for the active color theme, falling back to
 * the constructor default ({@link HTML_CONSTRUCTOR_DEFAULTS}) when no companion
 * is set. Baking the default in here is what lets templates read `-current`
 * without carrying any fallback of their own.
 */
const resolveCurrent = (variant: 'light' | 'dark') => {
    const d = HTML_CONSTRUCTOR_DEFAULTS;
    const pick = (name: string, fallback: string) =>
        variant === 'light'
            ? `var(--g-md-hc-${name}-light, ${fallback})`
            : `var(--g-md-hc-${name}-dark, var(--g-md-hc-${name}-light, ${fallback}))`;
    return `
    --g-md-hc-background-current: ${pick('background', d.background)};
    --g-md-hc-text-color-current: ${pick('text-color', d.textColor)};
    --g-md-hc-border-radius-current: ${pick('border-radius', d.borderRadius)};
    --g-md-hc-border-current: ${pick('border', d.border)};`;
};

const CONSUME = `
    background: var(--g-md-hc-background, var(--g-md-hc-background-current));
    color: var(--g-md-hc-text-color, var(--g-md-hc-text-color-current));
    border-radius: var(--g-md-hc-border-radius, var(--g-md-hc-border-radius-current));
    border: var(--g-md-hc-border, var(--g-md-hc-border-current));`;

const darkSelector = (selector: string) =>
    DARK_ROOTS.map((root) => `${root} ${selector}`).join(',\n');

/**
 * The base contract stylesheet: it resolves each light/dark companion (falling
 * back to the constructor defaults) for the active color theme and makes
 * structures/blocks consume the variables. Injected wherever constructor markup
 * is rendered standalone (output markdown, template previews); the in-editor
 * copy lives in the SCSS.
 */
export const HTML_CONSTRUCTOR_VARIABLES_CSS = `
${STRUCTURE},
${BLOCK} {${resolveCurrent('light')}
${CONSUME}
}
${darkSelector(STRUCTURE)},
${darkSelector(BLOCK)} {${resolveCurrent('dark')}
}`.trim();
