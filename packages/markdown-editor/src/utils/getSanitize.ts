import type {SanitizeOptions} from '@diplodoc/transform/lib/sanitize.js';
import * as sanitizeModule from '@diplodoc/transform/lib/sanitize.js';

type SanitizeFn = (
    html: string,
    options?: SanitizeOptions,
    additionalOptions?: SanitizeOptions,
) => string;

interface SanitizeModule {
    sanitize?: SanitizeFn;
    default?: SanitizeFn;
}

const sanitizeAll = (blockName: string) => () => {
    console.warn(`[${blockName}]: sanitize function not found`);
    return '';
};
export const getSanitize = (blockName: string): SanitizeFn => {
    const module = sanitizeModule as SanitizeModule;
    const sanitize = 'sanitize' in module && module.sanitize ? module.sanitize : module.default;
    return sanitize instanceof Function ? sanitize : sanitizeAll(blockName);
};
