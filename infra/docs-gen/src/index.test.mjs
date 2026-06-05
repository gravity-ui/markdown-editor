import assert from 'node:assert/strict';
import {existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {dirname, join} from 'node:path';
import process from 'node:process';
import {afterEach, test} from 'node:test';

import {createCommandHandlers} from './index.mjs';

const tempDirs = [];
const originalCwd = process.cwd();

afterEach(() => {
    process.chdir(originalCwd);
    while (tempDirs.length > 0) {
        rmSync(tempDirs.pop(), {recursive: true, force: true});
    }
});

function writeFixtureFile(filePath, content) {
    mkdirSync(dirname(filePath), {recursive: true});
    writeFileSync(filePath, content);
}

function createBuildFixture() {
    const rootDir = mkdtempSync(join(tmpdir(), 'markdown-editor-build-'));
    tempDirs.push(rootDir);

    writeFixtureFile(join(rootDir, 'docs', 'overview.md'), '##### Overview\n\nOverview body.\n');
    for (const preset of ['zero', 'commonmark', 'default', 'yfm', 'full']) {
        writeFixtureFile(
            join(rootDir, 'packages', 'editor', 'src', 'presets', `${preset}.ts`),
            'export const preset = true;\n',
        );
    }
    writeFixtureFile(
        join(rootDir, 'packages', 'editor', 'package.json'),
        JSON.stringify({name: '@gravity-ui/markdown-editor', version: '1.2.3'}, null, 2),
    );
    writeFixtureFile(
        join(rootDir, 'packages', 'editor', 'src', 'extensions', 'markdown', 'Bold', 'index.ts'),
        [
            'export const Bold = (builder) => {',
            '    builder.use(BoldSpecs);',
            "    builder.addKeymap(() => ({'Mod-b': toggleBold}));",
            '};',
        ].join('\n'),
    );
    writeFixtureFile(
        join(
            rootDir,
            'packages',
            'editor',
            'src',
            'extensions',
            'markdown',
            'Bold',
            'BoldSpecs',
            'index.ts',
        ),
        [
            'export const BoldSpecs = (builder) => {',
            "    builder.addMark('bold', () => ({}));",
            '};',
        ].join('\n'),
    );
    writeFixtureFile(
        join(rootDir, 'docs-gen', 'enriched', 'Bold.md'),
        [
            '---',
            'extension: Bold',
            'version: 1.2.3',
            'category: markdown',
            '---',
            '',
            '# Bold',
            '',
            'Adds bold text support.',
            '',
            '## Use Cases',
            '',
            '- Enable bold emphasis in markdown content.',
        ].join('\n'),
    );

    return rootDir;
}

test('build succeeds from a clean fixture when matching enriched docs are present', () => {
    const rootDir = createBuildFixture();
    process.chdir(rootDir);

    const commands = createCommandHandlers();
    commands.build();

    assert.equal(existsSync(join(rootDir, 'docs-src', 'extensions', 'bold.md')), true);
    assert.match(
        readFileSync(join(rootDir, 'docs-src', 'extensions', 'bold.md'), 'utf-8'),
        /Adds bold text support\./,
    );
    assert.match(
        readFileSync(join(rootDir, 'docs-src', 'extensions-index.md'), 'utf-8'),
        /\[Bold\]\(extensions\/bold\.md\)/,
    );
});
