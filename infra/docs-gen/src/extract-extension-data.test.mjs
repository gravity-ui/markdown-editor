import assert from 'node:assert/strict';
import {mkdirSync, mkdtempSync, rmSync, writeFileSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {dirname, join} from 'node:path';
import {afterEach, test} from 'node:test';

import {extractExtensionNamesFromSource} from './extension-ast.mjs';
import {extractExtensionNames} from './extract-extension-data.mjs';

const cleanupDirs = [];

function makeRepoRoot() {
    const root = mkdtempSync(join(tmpdir(), 'docs-gen-repo-'));
    cleanupDirs.push(root);

    return root;
}

function addFile(root, filePath, content) {
    const fullPath = join(root, filePath);

    mkdirSync(dirname(fullPath), {recursive: true});
    writeFileSync(fullPath, content);
}

afterEach(() => {
    for (const dir of cleanupDirs.splice(0)) {
        rmSync(dir, {recursive: true, force: true});
    }
});

test('extractExtensionNamesFromSource reads exported extension names from AST', () => {
    assert.deepEqual(
        extractExtensionNamesFromSource(
            [
                'export const Bold: ExtensionAuto<BoldOptions> = () => {};',
                'export const BoldSpecs = () => {};',
                'export type BoldOptions = {};',
                "export {boldMarkName} from './BoldSpecs';",
            ].join('\n'),
        ),
        ['Bold'],
    );
});

test('extractExtensionNames reads only whitelisted extension entry points', () => {
    const repoRoot = makeRepoRoot();

    addFile(
        repoRoot,
        'packages/editor/src/extensions/markdown/Bold/index.ts',
        [
            'export const Bold: ExtensionAuto<BoldOptions> = () => {};',
            'export const BoldSpecs: ExtensionAuto = () => {};',
        ].join('\n'),
    );
    addFile(
        repoRoot,
        'packages/editor/src/extensions/markdown/Heading/index.ts',
        'export const Heading: ExtensionWithOptions<HeadingOptions> = () => {};',
    );
    addFile(
        repoRoot,
        'packages/editor/src/extensions/markdown/Italic/index.ts',
        'export const Italic: ExtensionAuto = () => {};',
    );

    assert.deepEqual(
        extractExtensionNames({
            repoRoot,
            whitelist: [
                {name: 'Bold', entry: 'packages/editor/src/extensions/markdown/Bold/index.ts'},
                {
                    name: 'Heading',
                    entry: 'packages/editor/src/extensions/markdown/Heading/index.ts',
                },
            ],
        }),
        ['Bold', 'Heading'],
    );
});

test('extractExtensionNames fails when a whitelisted entry does not export the expected name', () => {
    const repoRoot = makeRepoRoot();

    addFile(
        repoRoot,
        'packages/editor/src/extensions/markdown/Bold/index.ts',
        'export const NotBold: ExtensionAuto = () => {};',
    );

    assert.throws(
        () =>
            extractExtensionNames({
                repoRoot,
                whitelist: [
                    {name: 'Bold', entry: 'packages/editor/src/extensions/markdown/Bold/index.ts'},
                ],
            }),
        /Expected "packages\/editor\/src\/extensions\/markdown\/Bold\/index.ts" to export extension "Bold"/,
    );
});
