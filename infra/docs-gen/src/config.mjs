export const extensionCategories = ['base', 'behavior', 'markdown', 'yfm', 'additional'];

export const internalExtensions = [
    'BaseInputRules',
    'BaseKeymap',
    'BaseStyles',
    'ReactRenderer',
    'SharedState',
];

export function isInternalExtension(name) {
    return internalExtensions.includes(name);
}
