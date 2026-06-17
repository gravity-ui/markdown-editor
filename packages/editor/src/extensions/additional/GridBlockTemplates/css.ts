export const gridScopeClass = (entityId: string) =>
    'grid-templates-scope-' + entityId.replace(/[^a-z0-9_-]/gi, '');

/** Prefixes every top-level selector with the scope class so rules stay local to one grid. */
export const scopeCss = (css: string, scopeClass: string): string =>
    css.replace(/(^|\})\s*([^{}]+)\{/g, (_match, brace, selectorList) => {
        const scoped = selectorList
            .split(',')
            .map((selector: string) => selector.trim())
            .filter(Boolean)
            .map((selector: string) => `.${scopeClass} ${selector}`)
            .join(', ');
        return `${brace}\n${scoped} {`;
    });
