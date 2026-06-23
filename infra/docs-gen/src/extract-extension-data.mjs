#!/usr/bin/env node
/* eslint-disable jsdoc/require-param, jsdoc/require-returns */
import {existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync} from 'node:fs';
import {join} from 'node:path';
import process from 'node:process';
import {fileURLToPath} from 'node:url';

import {sourceHasExtensionExport} from './extension-ast.mjs';
import {
    DOCS_GEN_DIR,
    EDITOR_EXTENSIONS_DIR,
    EXTENSION_BLACKLIST,
    EXTENSION_CATEGORIES,
    EXTRA_EXTENSION_REFS,
} from './extension-config.mjs';

export {
    DOCS_GEN_DIR,
    EDITOR_EXTENSIONS_DIR,
    EXTENSION_BLACKLIST,
    EXTENSION_CATEGORIES,
    EXTRA_EXTENSION_REFS,
    PAGE_CONSTRUCTOR_EXTENSION_DIR,
    REPO_ROOT,
} from './extension-config.mjs';

/** Checks that a candidate directory starts with an uppercase letter. */
function startsWithUppercaseLetter(name) {
    const firstChar = name.charAt(0);

    return (
        firstChar !== '' &&
        firstChar === firstChar.toUpperCase() &&
        firstChar !== firstChar.toLowerCase()
    );
}

/** Lists uppercase extension candidate directories under one category. */
function listExtensionRefs(dir) {
    if (!existsSync(dir)) return [];

    return readdirSync(dir, {withFileTypes: true})
        .filter((entry) => entry.isDirectory() && startsWithUppercaseLetter(entry.name))
        .map((entry) => ({name: entry.name, dir: join(dir, entry.name)}))
        .sort((left, right) => left.name.localeCompare(right.name));
}

/** Reads TypeScript sources from a candidate directory recursively. */
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

/** Checks whether any source in a candidate directory exports an extension. */
function refHasExtensionExport(ref) {
    return readSourceFiles(ref.dir).some(sourceHasExtensionExport);
}

/** Builds the filtered list of public extension names. */
export function listExtensionNames({
    extensionsDir = EDITOR_EXTENSIONS_DIR,
    categories = EXTENSION_CATEGORIES,
    extraExtensionRefs = EXTRA_EXTENSION_REFS,
    blacklist = EXTENSION_BLACKLIST,
} = {}) {
    const blacklistSet = new Set(blacklist);
    const refs = categories.flatMap((category) => listExtensionRefs(join(extensionsDir, category)));

    return [...refs, ...extraExtensionRefs]
        .filter((ref) => !blacklistSet.has(ref.name) && refHasExtensionExport(ref))
        .map((ref) => ref.name);
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
