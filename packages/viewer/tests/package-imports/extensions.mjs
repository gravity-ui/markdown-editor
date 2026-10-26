import assert from 'node:assert/strict';
import {mkdtemp, readFile, rm} from 'node:fs/promises';
import {createRequire} from 'node:module';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {test} from 'node:test';
import {fileURLToPath, pathToFileURL} from 'node:url';

import {build} from 'esbuild';

const require = createRequire(import.meta.url);

for (const [format, fixture] of [
    ['esm', 'extensions-consumer.ts'],
    ['cjs', 'extensions-consumer.cts'],
]) {
    test(`should render ${format.toUpperCase()} extensions on the server with CSS handling`, async (t) => {
        const directory = await mkdtemp(join(tmpdir(), `markdown-viewer-${format}-`));
        t.after(() => rm(directory, {recursive: true, force: true}));
        const outfile = join(directory, 'consumer.cjs');
        const result = await build({
            entryPoints: [fileURLToPath(new URL(`./${fixture}`, import.meta.url))],
            outfile,
            bundle: true,
            platform: 'node',
            format: 'cjs',
            loader: {'.css': 'empty'},
            metafile: true,
        });
        const inputs = Object.keys(result.metafile.inputs);
        assert.ok(inputs.some((path) => path.endsWith(`build/${format}/extensions.js`)));
        const otherFormat = format === 'esm' ? 'cjs' : 'esm';
        assert.ok(!inputs.some((path) => path.endsWith(`build/${otherFormat}/extensions.js`)));
        await import(pathToFileURL(outfile).href);
    });
}

test('should publish extension styles', async () => {
    const css = await readFile(require.resolve('@gravity-ui/markdown-viewer/styles.css'), 'utf8');
    assert.match(css, /white-space: pre-wrap/);
    assert.match(css, /\.yfm-clipboard-button/);
    assert.match(css, /\.g-md-files-gallery/);
    assert.match(css, /cursor: pointer/);
});

test('should remove unused extensions and their dependencies from JavaScript', async (t) => {
    const directory = await mkdtemp(join(tmpdir(), 'markdown-viewer-tree-shaking-'));
    t.after(() => rm(directory, {recursive: true, force: true}));
    const unusedExtensions = await build({
        entryPoints: [fileURLToPath(new URL('./unused-extensions-consumer.ts', import.meta.url))],
        outfile: join(directory, 'core.js'),
        bundle: true,
        platform: 'browser',
        format: 'esm',
        tsconfigRaw: {compilerOptions: {verbatimModuleSyntax: true}},
        metafile: true,
        write: false,
    });
    assert.ok(
        Object.keys(unusedExtensions.metafile.inputs).some((path) =>
            path.endsWith('build/esm/extensions.js'),
        ),
    );
    for (const [path, output] of Object.entries(unusedExtensions.metafile.outputs)) {
        if (!path.endsWith('.js')) continue;
        for (const [input, {bytesInOutput}] of Object.entries(output.inputs)) {
            if (bytesInOutput === 0) continue;
            assert.doesNotMatch(
                input,
                /\/(?:FilesGallery|YfmCodeBlockActions|@gravity-ui\/components)\//,
            );
        }
    }
});
