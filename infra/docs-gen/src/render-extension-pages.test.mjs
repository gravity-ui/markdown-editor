import {mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';

import {expect, it} from 'vitest';

import {renderExtensionPage, writeRenderedPages} from './render-extension-pages.mjs';

it('should render only statically resolved schema and action names', () => {
    const page = renderExtensionPage('##### Extensions / Bold\n\n# Bold\n', {
        source: 'packages/editor/src/extensions/markdown/Bold/index.ts',
        calls: [
            {method: 'addMarkSpec', value: 'strong'},
            {method: 'addMarkSpec', value: 'strong'},
            {method: 'addAction', value: 'bold'},
            {method: 'addAction', value: null},
        ],
    });

    expect(page).toContain('### Marks\n\n- `strong`');
    expect(page).toContain('### Actions\n\n- `bold`');
    expect(page).not.toContain('### Nodes');
    expect(page.match(/- `strong`/g)).toHaveLength(1);
});

it('should render temporary stubs into temporary pages', () => {
    const root = mkdtempSync(join(tmpdir(), 'markdown-editor-docs-'));

    try {
        const dir = join(root, 'tmp/docs-gen');
        mkdirSync(join(dir, 'stubs'), {recursive: true});
        writeFileSync(join(dir, 'stubs/Bold.md'), '##### Extensions / Bold\n\n# Bold\n');
        writeFileSync(
            join(dir, 'extensions.json'),
            JSON.stringify({extensions: [{name: 'Bold', source: 'Bold.ts', calls: []}]}),
        );

        expect(writeRenderedPages(root)).toBe(1);
        expect(readFileSync(join(dir, 'pages/Bold.md'), 'utf8')).toContain('Source: `Bold.ts`');
    } finally {
        rmSync(root, {recursive: true, force: true});
    }
});
