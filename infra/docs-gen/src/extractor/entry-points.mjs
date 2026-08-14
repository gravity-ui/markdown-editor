import {existsSync, readdirSync, statSync} from 'node:fs';
import {join} from 'node:path';

import {isBlacklistedExtension} from './blacklist.mjs';

function startsWithUppercaseLetter(name) {
    const firstChar = name.charAt(0);

    return (
        firstChar !== '' &&
        firstChar === firstChar.toUpperCase() &&
        firstChar !== firstChar.toLowerCase()
    );
}

function listExtensionDirs(dir) {
    if (!existsSync(dir)) return [];

    return readdirSync(dir)
        .filter((name) => {
            const fullPath = join(dir, name);
            return statSync(fullPath).isDirectory() && startsWithUppercaseLetter(name);
        })
        .map((name) => ({name, dir: join(dir, name)}))
        .sort((left, right) => left.name.localeCompare(right.name));
}

function collectCategoryExtensionRefs(entryPoint) {
    const extensionsRoot = join(entryPoint.packageDir, entryPoint.extensionsDir);
    const refs = [];

    for (const category of entryPoint.categories) {
        const categoryDir = join(extensionsRoot, category);

        for (const extensionDir of listExtensionDirs(categoryDir)) {
            refs.push({
                name: extensionDir.name,
                sourceDir: extensionDir.dir,
                category,
                entryPoint: entryPoint.id,
                packageName: entryPoint.packageName,
            });
        }
    }

    return refs;
}

function collectSingleExtensionRef(entryPoint) {
    return [
        {
            name: entryPoint.extensionName,
            sourceDir: entryPoint.extensionDir,
            category: 'external',
            entryPoint: entryPoint.id,
            packageName: entryPoint.packageName,
        },
    ];
}

export function collectExtensionRefs(entryPoints) {
    return entryPoints.flatMap((entryPoint) => {
        if (entryPoint.kind === 'category-dirs') return collectCategoryExtensionRefs(entryPoint);
        if (entryPoint.kind === 'single-extension') return collectSingleExtensionRef(entryPoint);

        return [];
    });
}

export function filterExtensionRefs(extensionRefs) {
    return extensionRefs.filter((extensionRef) => !isBlacklistedExtension(extensionRef.name));
}
