export const gridScopeClass = (entityId: string) =>
    'grid-templates-scope-' + entityId.replace(/[^a-z0-9_-]/gi, '');

export const blockClass = (index: number) => `block-${index + 1}`;

/** Wraps inline declarations (from a template's `style`) into a `selector { ... }` rule. */
export const inlineToRule = (declarations: string, selector = '&'): string => {
    const decls = declarations.trim().replace(/;?$/, ';');
    return decls === ';' ? '' : `${selector} {\n  ${decls}\n}`;
};

const scopeSelector = (selector: string, base: string) =>
    selector.includes('&')
        ? selector.replace(/&/g, base)
        : `${base} ${selector}`;

/**
 * Prefixes every top-level selector with `base` so rules stay local. `&` in a selector
 * is replaced with `base` itself (to target the scoped root), otherwise the selector
 * becomes a descendant of `base`.
 */
export const scopeCss = (css: string, base: string): string =>
    css.replace(/(^|\})\s*([^{}]+)\{/g, (_match, brace, selectorList) => {
        const scoped = selectorList
            .split(',')
            .map((selector: string) => selector.trim())
            .filter(Boolean)
            .map((selector: string) => scopeSelector(selector, base))
            .join(', ');
        return `${brace}\n${scoped} {`;
    });
