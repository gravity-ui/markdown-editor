import assert from 'node:assert/strict';
import {mkdtemp, rm} from 'node:fs/promises';
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
        const directory = await mkdtemp(join(tmpdir(), `viewer-page-constructor-${format}-`));
        t.after(() => rm(directory, {recursive: true, force: true}));
        const outfile = join(directory, 'consumer.cjs');
        const result = await build({
            entryPoints: [fileURLToPath(new URL(`./${fixture}`, import.meta.url))],
            outfile,
            bundle: true,
            platform: 'node',
            format: 'cjs',
            loader: {'.css': 'empty'},
            external: ['@gravity-ui/page-constructor'],
            metafile: true,
        });
        const inputs = Object.keys(result.metafile.inputs);
        assert.ok(inputs.some((path) => path.endsWith(`build/${format}/YfmPageConstructor.js`)));
        await import(pathToFileURL(outfile).href);
    });
}
