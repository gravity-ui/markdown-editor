import {mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';

import {expect, it} from 'vitest';

import {renderExtensionPage, writeRenderedPages} from '../src/render-extension-pages.mjs';

it('should render only statically resolved schema and action names', () => {
    const page = renderExtensionPage('##### Extensions / Sample\n\n# Sample\n', {
        source: 'src/extensions/markdown/Sample/index.ts',
        calls: [
            {method: 'addMarkSpec', value: 'sample'},
            {method: 'addMarkSpec', value: 'sample'},
            {method: 'addAction', value: 'toSample'},
            {method: 'addAction', value: null},
        ],
    });

    expect(page).toContain('### Marks\n\n- `sample`');
    expect(page).toContain('### Actions\n\n- `toSample`');
    expect(page).not.toContain('### Nodes');
    expect(page.match(/- `sample`/g)).toHaveLength(1);
});

it('should render temporary stubs into temporary pages', () => {
    const root = mkdtempSync(join(tmpdir(), 'markdown-editor-docs-'));

    try {
        const dir = join(root, 'tmp/docs-gen');
        mkdirSync(join(dir, 'stubs'), {recursive: true});
        writeFileSync(join(dir, 'stubs/Sample.md'), '##### Extensions / Sample\n\n# Sample\n');
        writeFileSync(
            join(dir, 'extensions.json'),
            JSON.stringify({extensions: [{name: 'Sample', source: 'Sample.ts', calls: []}]}),
        );

        expect(writeRenderedPages(root)).toBe(1);
        expect(readFileSync(join(dir, 'pages/Sample.md'), 'utf8')).toContain('Source: `Sample.ts`');
    } finally {
        rmSync(root, {recursive: true, force: true});
    }
});
