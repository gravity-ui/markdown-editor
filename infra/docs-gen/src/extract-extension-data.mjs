/* eslint-disable jsdoc/require-param, jsdoc/require-returns */
import {mkdirSync, readFileSync, writeFileSync} from 'node:fs';
import {dirname, join, resolve} from 'node:path';
import process from 'node:process';
import {fileURLToPath} from 'node:url';

import {extractExtensionNamesFromSource} from './extension-ast.mjs';
import {EXTENSION_WHITELIST, REPO_ROOT} from './extension-config.mjs';

function readWhitelistedExtensionName(repoRoot, {name, entry}) {
    const filePath = join(repoRoot, entry);
    const names = extractExtensionNamesFromSource(readFileSync(filePath, 'utf-8'), filePath);

    if (!names.includes(name)) {
        throw new Error(`Expected "${entry}" to export extension "${name}"`);
    }

    return name;
}

/** Reads extension names from the explicit documentation whitelist. */
export function extractExtensionNames({
    repoRoot = REPO_ROOT,
    whitelist = EXTENSION_WHITELIST,
} = {}) {
    return whitelist.map((extension) => readWhitelistedExtensionName(repoRoot, extension));
}

/** Writes a deterministic manifest for the documented extensions. */
export function writeExtensionsJson({repoRoot = REPO_ROOT, whitelist = EXTENSION_WHITELIST} = {}) {
    const names = extractExtensionNames({repoRoot, whitelist});
    const outputPath = join(repoRoot, 'tmp/docs-gen/extensions.json');

    mkdirSync(dirname(outputPath), {recursive: true});
    writeFileSync(
        outputPath,
        `${JSON.stringify({extensions: names.map((name) => ({name}))}, null, 2)}\n`,
    );

    return outputPath;
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
    writeExtensionsJson();
}
