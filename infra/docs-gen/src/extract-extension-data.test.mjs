import assert from 'node:assert/strict';
import {mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {dirname, join} from 'node:path';
import {afterEach, test} from 'node:test';

import {extractExtensionNames, writeExtensionsJson} from './extract-extension-data.mjs';

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

test('should read only whitelisted extension entry points', () => {
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

test('should fail when a whitelisted entry does not export the expected name', () => {
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

test('should write a manifest with the documented extension names', () => {
    const repoRoot = makeRepoRoot();
    const entry = 'packages/editor/src/extensions/markdown/Bold/index.ts';

    addFile(repoRoot, entry, 'export const Bold: ExtensionAuto = () => {};');

    const outputPath = writeExtensionsJson({repoRoot, whitelist: [{name: 'Bold', entry}]});

    assert.equal(outputPath, join(repoRoot, 'tmp/docs-gen/extensions.json'));
    assert.deepEqual(JSON.parse(readFileSync(outputPath, 'utf-8')), {
        extensions: [{name: 'Bold'}],
    });
});
