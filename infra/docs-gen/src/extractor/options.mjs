/**
 * English: Public entry point for extracting local extension option declarations.
 *
 * Русский: Публичная точка входа для извлечения локальных option declarations расширений.
 */
import {parseOptionDeclarations} from './options/declarations.mjs';
import {resolveOptionDeclaration} from './options/resolve.mjs';

/**
 * Selects preferred option declaration names.
 */
function selectOptionNames(declarations, preferredNames) {
    const existingPreferredNames = preferredNames.filter((name) => declarations.has(name));
    return existingPreferredNames.length > 0 ? existingPreferredNames : [...declarations.keys()];
}

/**
 * Extracts exported extension options fields.
 */
export function extractOptionsType(content, preferredNames = []) {
    const declarations = parseOptionDeclarations(content);

    for (const name of selectOptionNames(declarations, preferredNames)) {
        const fields = resolveOptionDeclaration(name, declarations);
        if (fields.length > 0) return fields;
    }

    return [];
}
