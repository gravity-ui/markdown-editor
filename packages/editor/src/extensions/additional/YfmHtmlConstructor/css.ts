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
