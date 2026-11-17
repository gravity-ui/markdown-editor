import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {test} from 'node:test';
import {fileURLToPath} from 'node:url';

import {createElement} from 'react';

import {build} from 'esbuild';
import {renderToString} from 'react-dom/server';

const require = createRequire(import.meta.url);

for (const [format, api] of [
    ['ESM', await import('@gravity-ui/markdown-viewer')],
    ['CJS', require('@gravity-ui/markdown-viewer')],
]) {
    test(`should import ${format} root exports and render without a DOM`, () => {
        assert.equal(typeof api.useViewerEffect, 'function');
        assert.equal(typeof api.ViewerTargets, 'function');
        assert.equal(typeof api.inspectViewerNode, 'function');
        assert.equal(typeof api.revealYfmElement, 'function');
        assert.equal(api.revealYfmElement(null), null);
        assert.equal(api.VIEWER_SLOT_ATTRIBUTE, 'data-markdown-viewer-slot');
        assert.equal(api.cnYFM(), 'yfm');
        const result = renderToString(
            createElement(
                api.MarkdownViewer,
                {html: '<p>Prepared HTML</p>'},
                createElement(api.ViewerTargets, {
                    selector: 'p',
                    children: () => assert.fail('Portal children must not render on the server'),
                }),
            ),
        );
        assert.match(result, /<p>Prepared HTML<\/p>/);
    });
}

test('should bundle only the reveal utility without React, styles or Diplodoc runtimes', async () => {
    const result = await build({
        stdin: {
            contents: "export {revealYfmElement} from '@gravity-ui/markdown-viewer';",
            resolveDir: fileURLToPath(new URL('.', import.meta.url)),
        },
        bundle: true,
        platform: 'browser',
        format: 'esm',
        metafile: true,
        write: false,
    });
    for (const output of Object.values(result.metafile.outputs)) {
        for (const [input, {bytesInOutput}] of Object.entries(output.inputs)) {
            if (bytesInOutput === 0) continue;
            assert.doesNotMatch(
                input,
                /\/(?:react|react-dom|@diplodoc|@gravity-ui\/(?:uikit|components))\/|\.(?:css|scss)$/,
            );
        }
    }
});
