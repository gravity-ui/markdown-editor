import assert from 'node:assert/strict';
import {existsSync, mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {dirname, join} from 'node:path';
import {afterEach, test} from 'node:test';

import {Assembler} from './assembler.mjs';

const tempDirs = [];

afterEach(() => {
    while (tempDirs.length > 0) {
        rmSync(tempDirs.pop(), {recursive: true, force: true});
    }
});

function writeFixtureFile(filePath, content) {
    mkdirSync(dirname(filePath), {recursive: true});
    writeFileSync(filePath, content);
}

function createAssemblerFixture() {
    const rootDir = mkdtempSync(join(tmpdir(), 'markdown-editor-assembler-'));
    tempDirs.push(rootDir);

    const docsGenDir = join(rootDir, 'docs-gen');
    const docsSrcDir = join(rootDir, 'docs-src');

    writeFixtureFile(
        join(docsGenDir, 'raw', 'Bold.md'),
        ['---', 'extension: Bold', 'version: 1.2.3', 'category: markdown', '---', '', '# Bold'].join(
            '\n',
        ),
    );
    writeFixtureFile(
        join(docsGenDir, 'extensions.json'),
        JSON.stringify([{name: 'Bold', category: 'markdown', marks: ['bold'], nodes: [], actions: []}], null, 2),
    );
    writeFixtureFile(join(docsSrcDir, 'index.md'), '# Markdown Editor\n');
    writeFixtureFile(
        join(docsSrcDir, 'toc.yaml'),
        ['title: Markdown Editor', 'href: index.md', 'items:', '  - name: Overview', '    href: index.md'].join(
            '\n',
        ),
    );

    return {docsGenDir, docsSrcDir};
}

test('assemble fails when enriched docs are missing for publishable extensions', () => {
    const {docsGenDir, docsSrcDir} = createAssemblerFixture();
    const assembler = new Assembler(docsGenDir, docsSrcDir);

    assert.throws(
        () => assembler.run(),
        /Missing enriched docs for publishable extensions: Bold/,
    );
});

test('assemble fails when enriched docs still contain AI markers', () => {
    const {docsGenDir, docsSrcDir} = createAssemblerFixture();
    writeFixtureFile(
        join(docsGenDir, 'enriched', 'Bold.md'),
        ['---', 'extension: Bold', 'version: 1.2.3', 'category: markdown', '---', '', '<!-- AI:NEEDED:description -->'].join(
            '\n',
        ),
    );

    const assembler = new Assembler(docsGenDir, docsSrcDir);
    assert.throws(
        () => assembler.run(),
        /Enriched doc for Bold still contains unresolved AI markers/,
    );
});

test('assemble fails when orphan enriched docs are present', () => {
    const {docsGenDir, docsSrcDir} = createAssemblerFixture();
    writeFixtureFile(
        join(docsGenDir, 'enriched', 'Bold.md'),
        ['---', 'extension: Bold', 'version: 1.2.3', 'category: markdown', '---', '', 'Bold description.'].join(
            '\n',
        ),
    );
    writeFixtureFile(
        join(docsGenDir, 'enriched', 'Ghost.md'),
        ['---', 'extension: Ghost', 'version: 1.2.3', 'category: markdown', '---', '', 'Ghost description.'].join(
            '\n',
        ),
    );

    const assembler = new Assembler(docsGenDir, docsSrcDir);
    assert.throws(() => assembler.run(), /Found orphan enriched docs: Ghost/);
});

test('assemble removes stale extension pages before writing refreshed output', () => {
    const {docsGenDir, docsSrcDir} = createAssemblerFixture();
    writeFixtureFile(
        join(docsGenDir, 'enriched', 'Bold.md'),
        [
            '---',
            'extension: Bold',
            'version: 1.2.3',
            'category: markdown',
            '---',
            '',
            '# Bold',
            '',
            'Bold description.',
            '',
            '## Use Cases',
            '',
            '- Enable inline emphasis.',
        ].join('\n'),
    );
    writeFixtureFile(join(docsSrcDir, 'extensions', 'stale.md'), 'stale');

    const assembler = new Assembler(docsGenDir, docsSrcDir);
    assembler.run();

    assert.equal(existsSync(join(docsSrcDir, 'extensions', 'stale.md')), false);
    assert.equal(existsSync(join(docsSrcDir, 'extensions', 'bold.md')), true);
    assert.match(readFileSync(join(docsSrcDir, 'extensions', 'bold.md'), 'utf-8'), /Bold description\./);
    assert.match(readFileSync(join(docsSrcDir, 'extensions-index.md'), 'utf-8'), /\[Bold\]\(extensions\/bold\.md\)/);
});
