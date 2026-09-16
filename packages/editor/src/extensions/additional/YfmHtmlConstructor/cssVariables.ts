import type {CSSProperties} from 'react';

import {htmlConstructorBlockClass, htmlConstructorStructureClass} from './css';
import type {HtmlConstructorBorderStyle, HtmlConstructorQuickStyle} from './types';

/** Toolbar overrides. Colors are per theme; border and radius apply to both themes. */
export const HTML_CONSTRUCTOR_CSS_VARS = {
    backgroundLight: '--g-md-hc-background-light',
    backgroundDark: '--g-md-hc-background-dark',
    textColorLight: '--g-md-hc-text-color-light',
    textColorDark: '--g-md-hc-text-color-dark',
    borderRadius: '--g-md-hc-border-radius',
    border: '--g-md-hc-border',
} as const;

/** Defaults used when neither the template nor the toolbar sets a value. */
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
