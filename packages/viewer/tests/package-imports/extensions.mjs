import assert from 'node:assert/strict';
import {mkdtemp, readFile, rm} from 'node:fs/promises';
import {createRequire} from 'node:module';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {fileURLToPath, pathToFileURL} from 'node:url';

import {build} from 'esbuild';

const require = createRequire(import.meta.url);
const directory = await mkdtemp(join(tmpdir(), 'markdown-viewer-extensions-'));

try {
    const outfile = join(directory, 'consumer.cjs');
    const result = await build({
        entryPoints: [fileURLToPath(new URL('./extensions-consumer.ts', import.meta.url))],
        outfile,
        bundle: true,
        platform: 'node',
        format: 'cjs',
        loader: {'.css': 'empty'},
        metafile: true,
    });
    for (const format of ['esm', 'cjs']) {
        assert.ok(
            Object.keys(result.metafile.inputs).some((path) =>
                path.endsWith(`build/${format}/extensions.js`),
            ),
        );
    }
    await import(pathToFileURL(outfile).href);

    const css = await readFile(require.resolve('@gravity-ui/markdown-viewer/styles.css'), 'utf8');
    assert.match(css, /white-space: pre-wrap/);
    assert.match(css, /\.yfm-clipboard-button/);
    console.info('Built ESM and CJS extensions exports support SSR with CSS handling.');
} finally {
    await rm(directory, {recursive: true, force: true});
}
