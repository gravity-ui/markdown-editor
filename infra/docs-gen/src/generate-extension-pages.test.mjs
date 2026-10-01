import {mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {dirname, join} from 'node:path';

import {expect, it} from 'vitest';

import {discoverExtensions, generateExtensionPages} from './generate-extension-pages.mjs';

function addSource(root, path, source) {
    const file = join(root, path);
    mkdirSync(dirname(file), {recursive: true});
    writeFileSync(file, source);
}

it('should regenerate temporary pages for every discovered extension', () => {
    const root = mkdtempSync(join(tmpdir(), 'markdown-editor-docs-'));

    try {
        for (const category of ['additional', 'base', 'behavior', 'markdown', 'yfm']) {
            mkdirSync(join(root, `packages/editor/src/extensions/${category}`), {recursive: true});
        }
        addSource(
            root,
            'packages/editor/src/extensions/markdown/Bold/index.ts',
            'export const Bold: ExtensionAuto = () => {};',
        );
        addSource(
            root,
            'packages/editor/src/extensions/markdown/Italic/index.ts',
            'export const Italic: ExtensionAuto = () => {};',
        );
        addSource(
            root,
            'packages/editor/src/extensions/behavior/Resizable/Resizable.tsx',
            'export const Resizable: React.FC = () => null;',
        );
        addSource(
            root,
            'packages/page-constructor-extension/src/extension/index.ts',
            'export const YfmPageConstructorExtension: ExtensionAuto = () => {};',
        );

        expect(discoverExtensions(root).map(({name}) => name)).toEqual([
            'Bold',
            'Italic',
            'YfmPageConstructorExtension',
        ]);

        generateExtensionPages(root);
        const boldPage = join(root, 'tmp/docs-gen/stubs/Bold.md');
        expect(readFileSync(boldPage, 'utf8')).toContain('# Bold');

        writeFileSync(boldPage, '# Edited Bold\n');
        generateExtensionPages(root);
        expect(readFileSync(boldPage, 'utf8')).toContain('# Bold');
    } finally {
        rmSync(root, {recursive: true, force: true});
    }
});
