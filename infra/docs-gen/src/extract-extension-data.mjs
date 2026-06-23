#!/usr/bin/env node
/* eslint-disable jsdoc/require-param, jsdoc/require-returns */
import {existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync} from 'node:fs';
import {join} from 'node:path';
import process from 'node:process';
import {fileURLToPath} from 'node:url';

import {readExtensionExportNames} from './extension-ast.mjs';
import {
    DOCS_GEN_DIR,
    EDITOR_EXTENSIONS_DIR,
    EXTENSION_BLACKLIST,
    EXTENSION_CATEGORIES,
    EXTRA_EXTENSION_DIRS,
} from './extension-config.mjs';

/** Reads TypeScript sources from a directory recursively. */
function readSourceFiles(dir) {
    if (!existsSync(dir)) return [];

    const files = [];
    for (const entry of readdirSync(dir, {withFileTypes: true})) {
        const fullPath = join(dir, entry.name);

        if (entry.isDirectory()) {
            files.push(...readSourceFiles(fullPath));
        } else if (entry.isFile() && (entry.name.endsWith('.ts') || entry.name.endsWith('.tsx'))) {
            files.push(readFileSync(fullPath, 'utf-8'));
        }
    }

    return files;
}

/** Builds configured source roots for extension scanning. */
function listExtensionSourceDirs(extensionsDir, categories, extraExtensionDirs) {
    return categories.map((category) => join(extensionsDir, category)).concat(extraExtensionDirs);
}

/** Builds the filtered list of public extension names. */
export function listExtensionNames({
    extensionsDir = EDITOR_EXTENSIONS_DIR,
    categories = EXTENSION_CATEGORIES,
    extraExtensionDirs = EXTRA_EXTENSION_DIRS,
    blacklist = EXTENSION_BLACKLIST,
} = {}) {
    const blacklistSet = new Set(blacklist);
    const names = listExtensionSourceDirs(extensionsDir, categories, extraExtensionDirs)
        .flatMap(readSourceFiles)
        .flatMap(readExtensionExportNames);

    return [...new Set(names)]
        .filter((name) => !blacklistSet.has(name))
        .sort((left, right) => left.localeCompare(right));
}

/** Converts extension names into JSON records. */
export function createExtensionRecords(names) {
    return names.map((name) => ({name}));
}

/** Writes generated extension records into the docs-gen output directory. */
export function writeExtensionsJson(outDir = DOCS_GEN_DIR, names = listExtensionNames()) {
    mkdirSync(outDir, {recursive: true});
    writeFileSync(
        join(outDir, 'extensions.json'),
        `${JSON.stringify({extensions: createExtensionRecords(names)}, null, 2)}\n`,
    );
}

/** Runs the extension data extraction CLI. */
export function main() {
    writeExtensionsJson();
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
    main();
}
