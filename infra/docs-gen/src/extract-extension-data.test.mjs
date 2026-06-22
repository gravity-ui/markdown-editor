import assert from 'node:assert/strict';
import {mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {afterEach, test} from 'node:test';

import {
    createExtensionRecords,
    listExtensionNames,
    writeExtensionsJson,
} from './extract-extension-data.mjs';

const cleanupDirs = [];

function makeExtensionsRoot() {
    const root = mkdtempSync(join(tmpdir(), 'docs-gen-extensions-'));
    cleanupDirs.push(root);

    return root;
}

function addExtensionFile(root, category, name, content) {
    const dir = join(root, category, name);

    mkdirSync(dir, {recursive: true});
    writeFileSync(join(dir, 'index.ts'), content);
}

afterEach(() => {
    for (const dir of cleanupDirs.splice(0)) {
        rmSync(dir, {recursive: true, force: true});
    }
});

test('listExtensionNames keeps AST-backed extension dirs and applies blacklist', () => {
    const extensionsDir = makeExtensionsRoot();
    const extraDir = makeExtensionsRoot();

    addExtensionFile(
        extensionsDir,
        'base',
        'BaseKeymap',
        'export const BaseKeymap: ExtensionAuto = () => {};',
    );
    addExtensionFile(extensionsDir, 'base', 'Bold', 'export const Bold: ExtensionAuto = () => {};');
    addExtensionFile(
        extensionsDir,
        'behavior',
        'Resizable',
        'export const Resizable: React.FC = () => null;',
    );
    addExtensionFile(
        extensionsDir,
        'additional',
        'GPT',
        'export const gptExtension = (builder: ExtensionBuilder) => builder;',
    );
    addExtensionFile(extensionsDir, 'additional', 'Widget', 'export const Widget = () => null;');
    writeFileSync(
        join(extraDir, 'index.ts'),
        'export const YfmPageConstructorExtension: ExtensionAuto = () => {};',
    );

    assert.deepEqual(
        listExtensionNames({
            extensionsDir,
            categories: ['base', 'behavior', 'additional'],
            extraExtensionRefs: [{name: 'YfmPageConstructorExtension', dir: extraDir}],
        }),
        ['Bold', 'GPT', 'YfmPageConstructorExtension'],
    );
});

test('writeExtensionsJson writes extension name records', () => {
    const outDir = makeExtensionsRoot();

    writeExtensionsJson(outDir, ['Bold', 'GPT']);

    assert.deepEqual(JSON.parse(readFileSync(join(outDir, 'extensions.json'), 'utf-8')), {
        extensions: createExtensionRecords(['Bold', 'GPT']),
    });
});
