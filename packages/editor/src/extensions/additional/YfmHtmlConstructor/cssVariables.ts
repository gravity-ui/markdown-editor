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
 *       -> a neutral fallback.
 *
 * The toolbar writes the override variable; themes set the light/dark companions.
 */
export const HTML_CONSTRUCTOR_CSS_VARS = {
    background: '--g-md-hc-background',
    textColor: '--g-md-hc-text-color',
    borderRadius: '--g-md-hc-border-radius',
    border: '--g-md-hc-border',
} as const;

const borderToValue = (style: HtmlConstructorBorderStyle): string =>
    style === 'none' ? 'none' : `1px ${style} var(--g-color-line-generic)`;

/** Maps a quick-style selection onto the public override CSS variables. */
export const quickStyleToCssVars = (
    quickStyle: HtmlConstructorQuickStyle | undefined,
): Record<string, string> => {
    const vars: Record<string, string> = {};
    if (!quickStyle) return vars;

    if (quickStyle.background) vars[HTML_CONSTRUCTOR_CSS_VARS.background] = quickStyle.background;
    if (quickStyle.textColor) vars[HTML_CONSTRUCTOR_CSS_VARS.textColor] = quickStyle.textColor;
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

const resolveCurrent = (variant: 'light' | 'dark') => `
    --g-md-hc-background-current: ${
        variant === 'light'
            ? 'var(--g-md-hc-background-light)'
            : 'var(--g-md-hc-background-dark, var(--g-md-hc-background-light))'
    };
    --g-md-hc-text-color-current: ${
        variant === 'light'
            ? 'var(--g-md-hc-text-color-light)'
            : 'var(--g-md-hc-text-color-dark, var(--g-md-hc-text-color-light))'
    };
    --g-md-hc-border-radius-current: ${
        variant === 'light'
            ? 'var(--g-md-hc-border-radius-light)'
            : 'var(--g-md-hc-border-radius-dark, var(--g-md-hc-border-radius-light))'
    };
    --g-md-hc-border-current: ${
        variant === 'light'
            ? 'var(--g-md-hc-border-light)'
            : 'var(--g-md-hc-border-dark, var(--g-md-hc-border-light))'
    };`;

const CONSUME = `
    background: var(--g-md-hc-background, var(--g-md-hc-background-current, transparent));
    color: var(--g-md-hc-text-color, var(--g-md-hc-text-color-current, inherit));
    border-radius: var(--g-md-hc-border-radius, var(--g-md-hc-border-radius-current, 0));
    border: var(--g-md-hc-border, var(--g-md-hc-border-current, none));`;

const darkSelector = (selector: string) =>
    DARK_ROOTS.map((root) => `${root} ${selector}`).join(',\n');

/**
 * The base contract stylesheet: it resolves each light/dark companion for the
 * active color theme and makes structures/blocks consume the variables. Injected
 * wherever constructor markup is rendered standalone (output markdown, template
 * previews); the in-editor copy lives in the SCSS so it can keep editor chrome
 * fallbacks (rounded corners, spacing border).
 */
export const HTML_CONSTRUCTOR_VARIABLES_CSS = `
${STRUCTURE},
${BLOCK} {${resolveCurrent('light')}
${CONSUME}
}
${darkSelector(STRUCTURE)},
${darkSelector(BLOCK)} {${resolveCurrent('dark')}
}`.trim();
