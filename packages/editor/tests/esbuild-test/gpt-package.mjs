import assert from 'node:assert/strict';
import {fileURLToPath} from 'node:url';

import {build} from 'esbuild';

for (const kind of ['import', 'require']) {
    const result = await build({
        absWorkingDir: fileURLToPath(new URL('../..', import.meta.url)),
        stdin: {
            contents:
                kind === 'import'
                    ? "export * from '@gravity-ui/markdown-editor-gpt-extension';"
                    : "module.exports = require('@gravity-ui/markdown-editor-gpt-extension');",
            resolveDir: fileURLToPath(new URL('../..', import.meta.url)),
        },
        bundle: true,
        format: kind === 'import' ? 'esm' : 'cjs',
        loader: {'.css': 'empty'},
        write: false,
        metafile: true,
    });
    const inputs = Object.keys(result.metafile.inputs);
    assert(inputs.some((input) => input.includes('/gpt-extension/build/')));
    assert(!inputs.some((input) => /\/editor\/(src|build)\//.test(input)));
}
