export const htmlConstructorStructureClass = 'g-md-hc-structure';
export const htmlConstructorBlockClass = 'g-md-hc-block';

export const structureClass = (index = 0) => `${htmlConstructorStructureClass}-${index + 1}`;
export const blockClass = (index: number) => `${htmlConstructorBlockClass}-${index + 1}`;

export const structureSelector = (index = 0) =>
    `.${htmlConstructorStructureClass}.${structureClass(index)}`;
export const blockSelector = (index: number) =>
    `.${htmlConstructorBlockClass}.${blockClass(index)}`;

/** Wraps inline declarations into a `selector { ... }` rule. */
export const inlineToRule = (declarations: string, selector = '&'): string => {
    const decls = declarations.trim().replace(/;?$/, ';');
    return decls === ';' ? '' : `${selector} {\n  ${decls}\n}`;
};

export const templateCssToRules = (css: string, selector = '&'): string => {
    const value = css.trim();
    if (!value) return '';

    return value.includes('{') ? value : inlineToRule(value, selector);
};

export const replaceCssAnchor = (css: string, selector: string): string =>
    css.trim().replace(/&/g, selector);

export const htmlConstructorScopeClassName = (scopeId: string) => `g-md-hc-scope-${scopeId}`;

/** Small, stable, non-cryptographic hash rendered as a short base36 string. */
export const hashToScopeId = (value: string): string => {
    let hash = 5381;
    for (let index = 0; index < value.length; index++) {
        // djb2-style, kept in a safe integer range with modulo instead of bitwise ops.
        hash = (hash * 33 + value.charCodeAt(index)) % 0xffffffff;
    }
    return hash.toString(36);
};

/**
 * Prefixes every style-rule selector in `css` with `scopeSelector`
 * (e.g. `.g-md-hc-scope-abc`) so the rules only match inside one instance's
 * subtree. At-rule preludes (`@media`, …) are preserved and their nested rules
 * scoped; declarations are copied verbatim.
 *
 * This is a lightweight scoper for the constructor's own generated CSS, not a
 * general-purpose CSS parser (declarations are assumed brace-free).
 */
export const scopeCss = (css: string, scopeSelector: string): string => {
    const scopeSelectorList = (selectors: string) =>
        selectors
            .split(',')
            .map((part) => part.trim())
            .filter(Boolean)
            .map((part) => `${scopeSelector} ${part}`)
            .join(', ');

    let out = '';
    let buf = '';
    let i = 0;

    const copyDeclarations = () => {
        while (i < css.length) {
            const ch = css[i++];
            out += ch;
            if (ch === '}') return;
        }
    };

    const parseRules = () => {
        while (i < css.length) {
            const ch = css[i];
            if (ch === '}') {
                i++;
                out += '}';
                return;
            }
            if (ch === '{') {
                i++;
                const prelude = buf.trim();
                buf = '';
                out += out && !out.endsWith('\n') ? '\n' : '';
                if (prelude.startsWith('@')) {
                    out += `${prelude} {`;
                    parseRules();
                } else {
                    out += `${scopeSelectorList(prelude)} {`;
                    copyDeclarations();
                }
                continue;
            }
            buf += ch;
            i++;
        }
    };

    parseRules();
    return out.trim();
};
