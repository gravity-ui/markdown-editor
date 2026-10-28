import assert from 'node:assert/strict';
import {fileURLToPath} from 'node:url';

import {build} from 'esbuild';

for (const kind of ['import', 'require']) {
    const result = await build({
        absWorkingDir: fileURLToPath(new URL('../..', import.meta.url)),
        stdin: {
            contents:
                kind === 'import'
                    ? "export * from '@gravity-ui/markdown-editor/react-renderer';"
                    : "module.exports = require('@gravity-ui/markdown-editor/react-renderer');",
            resolveDir: fileURLToPath(new URL('../..', import.meta.url)),
        },
        bundle: true,
        format: kind === 'import' ? 'esm' : 'cjs',
        write: false,
        metafile: true,
    });
    const inputs = Object.keys(result.metafile.inputs);
    const buildFormat = kind === 'import' ? 'esm' : 'cjs';

    assert(inputs.some((input) => input.includes(`build/${buildFormat}/react-renderer/index.js`)));
    assert(!inputs.some((input) => input.includes('/extensions/additional/GPT/')));
    assert(!inputs.some((input) => input.includes('/bundle/')));

    if (kind === 'import') {
        assert.deepEqual(Object.values(result.metafile.outputs)[0].exports.sort(), [
            'ReactRendererFacet',
            'getReactRendererFromState',
        ]);
    }
}
