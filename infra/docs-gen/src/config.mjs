export const extensionCategories = ['base', 'behavior', 'markdown', 'yfm', 'additional'];

export const internalExtensions = [
    'BaseInputRules',
    'BaseKeymap',
    'BaseStyles',
    'ReactRenderer',
    'SharedState',
];

/**
 * Checks whether an extension is internal-only infrastructure.
 */
export function isInternalExtension(name) {
    return internalExtensions.includes(name);
}
