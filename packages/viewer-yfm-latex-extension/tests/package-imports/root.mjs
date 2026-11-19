import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {test} from 'node:test';

import {createElement} from 'react';

import {renderToString} from 'react-dom/server';

const require = createRequire(import.meta.url);

for (const [format, load, loadViewer] of [
    [
        'ESM',
        () => import('@gravity-ui/markdown-viewer-yfm-latex-extension'),
        () => import('@gravity-ui/markdown-viewer'),
    ],
    [
        'CJS',
        () => require('@gravity-ui/markdown-viewer-yfm-latex-extension'),
        () => require('@gravity-ui/markdown-viewer'),
    ],
]) {
    test(`should import ${format} and render without a browser runtime`, async () => {
        const api = await load();
        const {MarkdownViewer} = await loadViewer();
        assert.equal(typeof api.YfmLatex, 'function');
        const html = '<span class="yfm-latex" data-content="x">Formula</span>';
        const result = renderToString(
            createElement(
                MarkdownViewer,
                {html},
                createElement(api.YfmLatex, {
                    meta: {
                        script: ['_assets/latex-extension.js'],
                        style: ['_assets/latex-extension.css'],
                    },
                }),
            ),
        );
        assert.ok(result.includes(html));
        assert.equal(typeof globalThis.window, 'undefined');
    });
}
