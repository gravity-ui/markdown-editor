export const getZIndexFromVariables = (variable: string): number => {
    const zIndexValue = getComputedStyle(document.documentElement)
        .getPropertyValue(variable)
        .trim();

    return parseInt(zIndexValue, 10) || 0;
};
