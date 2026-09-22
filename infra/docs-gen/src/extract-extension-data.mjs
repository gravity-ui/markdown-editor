/* eslint-disable jsdoc/require-param, jsdoc/require-returns */
import {readFileSync} from 'node:fs';
import {join} from 'node:path';

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
