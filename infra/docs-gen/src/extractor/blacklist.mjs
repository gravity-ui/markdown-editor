export const INTERNAL_EXTENSION_BLACKLIST = [
    'BaseInputRules',
    'BaseKeymap',
    'BaseStyles',
    'ReactRenderer',
    'SharedState',
];

export const EXTENSION_BLACKLIST = ['YfmCut'];

export function isBlacklistedExtension(name) {
    return [...INTERNAL_EXTENSION_BLACKLIST, ...EXTENSION_BLACKLIST].includes(name);
}
