#!/usr/bin/env node
import {existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync} from 'node:fs';
import {dirname, join, resolve} from 'node:path';
import process from 'node:process';
import {fileURLToPath} from 'node:url';

import {sourceHasExtensionExport} from './extension-ast.mjs';

export const REPO_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '../../..');
export const DOCS_GEN_DIR = join(REPO_ROOT, 'tmp/docs-gen');
export const EDITOR_EXTENSIONS_DIR = join(REPO_ROOT, 'packages/editor/src/extensions');
export const PAGE_CONSTRUCTOR_EXTENSION_DIR = join(
    REPO_ROOT,
    'packages/page-constructor-extension/src/extension',
);
export const EXTENSION_CATEGORIES = ['base', 'behavior', 'markdown', 'yfm', 'additional'];
export const EXTRA_EXTENSION_REFS = [
    {name: 'YfmPageConstructorExtension', dir: PAGE_CONSTRUCTOR_EXTENSION_DIR},
];
export const EXTENSION_BLACKLIST = [
    'BaseInputRules',
    'BaseKeymap',
    'BaseStyles',
    'ReactRenderer',
    'Resizable',
    'SharedState',
    'YfmCut',
];

function startsWithUppercaseLetter(name) {
    const firstChar = name.charAt(0);

    return (
        firstChar !== '' &&
        firstChar === firstChar.toUpperCase() &&
        firstChar !== firstChar.toLowerCase()
    );
}

function listExtensionRefs(dir) {
    if (!existsSync(dir)) return [];

    return readdirSync(dir, {withFileTypes: true})
        .filter((entry) => entry.isDirectory() && startsWithUppercaseLetter(entry.name))
        .map((entry) => ({name: entry.name, dir: join(dir, entry.name)}))
        .sort((left, right) => left.name.localeCompare(right.name));
}

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

function refHasExtensionExport(ref) {
    return readSourceFiles(ref.dir).some(sourceHasExtensionExport);
}

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

export function createExtensionRecords(names) {
    return names.map((name) => ({name}));
}

export function writeExtensionsJson(outDir = DOCS_GEN_DIR, names = listExtensionNames()) {
    mkdirSync(outDir, {recursive: true});
    writeFileSync(
        join(outDir, 'extensions.json'),
        `${JSON.stringify({extensions: createExtensionRecords(names)}, null, 2)}\n`,
    );
}

export function main() {
    writeExtensionsJson();
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
    main();
}
