/**
 * English: Collects configured extension entry points into scan references.
 *
 * Русский: Собирает сконфигурированные entry points расширений в scan references.
 */
import {join} from 'node:path';

import {isBlacklistedExtension} from '../config.mjs';
import {listDirs} from '../utils.mjs';

/**
 * Creates one scan reference for an extension directory.
 */
function createExtensionRef(entryPoint, {name, category, extDir}) {
    return {
        name,
        packageName: entryPoint.packageName,
        entryPoint: entryPoint.id,
        category,
        extDir,
    };
}

/**
 * Collects extension references from category-based editor package directories.
 */
function collectCategoryExtensionRefs(entryPoint) {
    const refs = [];

    for (const category of entryPoint.categories) {
        const categoryDir = join(entryPoint.packageDir, entryPoint.extensionsDir, category);
        for (const dirName of listDirs(categoryDir)) {
            refs.push(
                createExtensionRef(entryPoint, {
                    name: dirName,
                    category,
                    extDir: join(categoryDir, dirName),
                }),
            );
        }
    }

    return refs;
}

/**
 * Collects a package that exposes one extension entry point.
 */
function collectSingleExtensionRef(entryPoint) {
    return [
        createExtensionRef(entryPoint, {
            name: entryPoint.extensionName,
            category: entryPoint.category,
            extDir: join(entryPoint.packageDir, entryPoint.extensionDir),
        }),
    ];
}

/**
 * Collects all extension references from configured entry points.
 */
export function collectExtensionRefs(entryPoints) {
    return entryPoints.flatMap((entryPoint) => {
        switch (entryPoint.kind) {
            case 'category-dirs':
                return collectCategoryExtensionRefs(entryPoint);
            case 'single-extension':
                return collectSingleExtensionRef(entryPoint);
            default:
                throw new Error(`Unknown extension entry point kind: ${entryPoint.kind}`);
        }
    });
}

/**
 * Applies configured filters after the full extension list is known.
 */
export function filterExtensionRefs(refs, {only} = {}) {
    const onlySet = only?.length ? new Set(only) : null;

    return refs.filter((ref) => {
        if (isBlacklistedExtension(ref.name)) return false;
        return !onlySet || onlySet.has(ref.name);
    });
}
