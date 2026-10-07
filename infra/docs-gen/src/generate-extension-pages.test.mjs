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
            'packages/editor/src/extensions/behavior/SharedState/SharedState.ts',
            'export const SharedState: Extension = () => {};',
        );
        addSource(
            root,
            'packages/page-constructor-extension/src/extension/index.ts',
            'export const YfmPageConstructorExtension: ExtensionAuto = () => {};',
        );
        addSource(
            root,
            'packages/page-constructor-extension/src/extension/YfmPageConstructorSpecs/index.tsx',
            "export {nodeName} from './const'; export const YfmPageConstructorSpecsExtension = Object.assign(() => {}, {});",
        );

        const names = discoverExtensions(root).map(({name}) => name);
        expect(names).toEqual([
            'Bold',
            'Italic',
            'YfmPageConstructorExtension',
            'YfmPageConstructorSpecsExtension',
        ]);

        generateExtensionPages(root);
        for (const name of names) {
            expect(readFileSync(join(root, `tmp/docs-gen/stubs/${name}.md`), 'utf8')).toBe(
                `##### Extensions / ${name}\n\n# ${name}\n`,
            );
        }
        const boldPage = join(root, 'tmp/docs-gen/stubs/Bold.md');

        writeFileSync(boldPage, '# Edited Bold\n');
        addSource(
            root,
            'packages/editor/src/extensions/markdown/NewThing/index.ts',
            'export const NewThing: ExtensionAuto = () => {};',
        );
        generateExtensionPages(root);
        expect(readFileSync(boldPage, 'utf8')).toBe('##### Extensions / Bold\n\n# Bold\n');
        expect(readFileSync(join(root, 'tmp/docs-gen/stubs/NewThing.md'), 'utf8')).toBe(
            '##### Extensions / NewThing\n\n# NewThing\n',
        );
    } finally {
        rmSync(root, {recursive: true, force: true});
    }
});
