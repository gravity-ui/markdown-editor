import {type Document, type Rule, parse} from 'postcss';
import selectorParser from 'postcss-selector-parser';

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

const isKeyframe = (rule: Rule): boolean => {
    for (let parent: Rule['parent'] | Document = rule.parent; parent; parent = parent.parent) {
        if (parent.type === 'atrule' && /(?:^|-)keyframes$/i.test(parent.name)) return true;
    }
    return false;
};

const hasRuleAncestor = (rule: Rule): boolean => {
    for (let parent: Rule['parent'] | Document = rule.parent; parent; parent = parent.parent) {
        if (parent.type === 'rule') return true;
    }
    return false;
};

const transformRules = (css: string, transform: (rule: Rule) => void, fallback = ''): string => {
    try {
        const root = parse(css);
        root.walkRules((rule) => {
            if (!isKeyframe(rule)) transform(rule);
        });
        return root.toString().trim();
    } catch {
        return fallback;
    }
};

export const replaceCssAnchor = (css: string, selector: string): string =>
    transformRules(
        css,
        (rule) => {
            if (hasRuleAncestor(rule)) return;
            const replacement = selectorParser().astSync(selector).first;
            rule.assign({
                selector: selectorParser((root) => {
                    root.walkNesting((anchor) => {
                        const nodes = replacement.nodes.map((node) => node.clone());
                        nodes[0].spaces.before = anchor.spaces.before;
                        anchor.replaceWith(...nodes);
                    });
                }).processSync(rule.selector),
            });
        },
        css,
    );

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

/** Scope selectors without rewriting declarations, keyframes or CSS strings. */
export const scopeCss = (css: string, scopeSelector?: string, exclude?: string): string =>
    transformRules(css, (rule) => {
        rule.assign({
            selector: selectorParser((root) => {
                root.each((selector) => {
                    if (exclude) {
                        const exclusion = selectorParser().astSync(`:not(${exclude}, ${exclude} *)`)
                            .first.first;
                        const pseudoElement = selector.nodes.find(
                            (node) =>
                                node.type === 'pseudo' &&
                                /^(::|:(before|after|first-line|first-letter)$)/.test(node.value),
                        );
                        if (pseudoElement) selector.insertBefore(pseudoElement, exclusion);
                        else selector.append(exclusion);
                    }
                    if (scopeSelector && !hasRuleAncestor(rule)) {
                        const prefix = selectorParser().astSync(scopeSelector).first;
                        prefix.first.spaces.before = selector.first.spaces.before;
                        selector.first.spaces.before = '';
                        selector.prepend(selectorParser.combinator({value: ' '}));
                        for (const node of [...prefix.nodes].reverse())
                            selector.prepend(node.clone());
                    }
                });
            }).processSync(rule.selector),
        });
    });
