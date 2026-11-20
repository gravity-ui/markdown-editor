import assert from 'node:assert/strict';
import {mkdtemp, readFile, rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {test} from 'node:test';
import {fileURLToPath, pathToFileURL} from 'node:url';

import {build} from 'esbuild';

for (const [format, fixture] of [
    ['esm', 'consumer.ts'],
    ['cjs', 'consumer.cts'],
]) {
    test(`should render ${format.toUpperCase()} on the server with CSS handling`, async (t) => {
        const directory = await mkdtemp(join(tmpdir(), `viewer-mermaid-${format}-`));
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
        assert.ok(inputs.some((path) => path.endsWith(`build/${format}/YfmMermaid.js`)));
        const otherFormat = format === 'esm' ? 'cjs' : 'esm';
        assert.ok(!inputs.some((path) => path.endsWith(`build/${otherFormat}/YfmMermaid.js`)));
        await import(pathToFileURL(outfile).href);
    });
}

test('should export standalone styles that can be combined with Diplodoc zoom styles', async () => {
    const stylesheet = await readFile(
        new URL(
            import.meta.resolve('@gravity-ui/markdown-viewer-yfm-mermaid-extension/styles.css'),
        ),
        'utf8',
    );
    assert.doesNotMatch(stylesheet, /@import|data-mermaid-zoom-enabled/);

    const css = await bundleStyles(`
        import '@diplodoc/mermaid-extension/styles/zoom.css';
        import '@gravity-ui/markdown-viewer-yfm-mermaid-extension/styles.css';
    `);
    assertDiagramStyles(css);
});

test('should keep component styles when tree shaking the browser bundle', async () => {
    const css = await bundleStyles(
        "export {YfmMermaid} from '@gravity-ui/markdown-viewer-yfm-mermaid-extension';",
    );
    assertDiagramStyles(css);
});

async function bundleStyles(contents) {
    const result = await build({
        stdin: {
            contents,
            resolveDir: fileURLToPath(new URL('../..', import.meta.url)),
        },
        outfile: join(tmpdir(), 'viewer-mermaid-consumer.js'),
        bundle: true,
        platform: 'browser',
        format: 'esm',
        treeShaking: true,
        write: false,
    });
    const css = result.outputFiles.find((file) => file.path.endsWith('.css'));
    assert.ok(css, 'The browser bundle must include CSS');
    return css.text;
}

function assertDiagramStyles(css) {
    assert.match(css, /\[data-mermaid-zoom-enabled/);
    assert.match(css, /\.g-md-v-yfm-mermaid\s*\{/);
    assert.match(css, /--mermaid-zoom-control-color:\s*var\(--g-color-text-primary\)/);
}
