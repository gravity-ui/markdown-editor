import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {test} from 'node:test';

import {createElement} from 'react';

import {renderToString} from 'react-dom/server';

const require = createRequire(import.meta.url);
const extension = '@gravity-ui/markdown-viewer-yfm-html-extension';
const viewer = '@gravity-ui/markdown-viewer';

for (const [format, load] of [
    ['ESM', (name) => import(name)],
    ['CJS', require],
]) {
    test(`should render HTML blocks on the server using ${format}`, async () => {
        const {YfmHtmlBlock, toIframeCssVariables} = await load(extension);
        const {MarkdownViewer} = await load(viewer);
        const html = '<iframe data-yfm-sandbox-mode="srcdoc"></iframe>';
        const result = renderToString(
            createElement(
                MarkdownViewer,
                {html},
                createElement(YfmHtmlBlock, {
                    meta: {script: ['_assets/html-extension.js']},
                    config: {styles: toIframeCssVariables({colorLink: 'blue'})},
                }),
            ),
        );
        assert.ok(result.includes(html));
    });
}
