import assert from 'node:assert/strict';
import {createRequire} from 'node:module';

import {createElement} from 'react';

import {renderToString} from 'react-dom/server';

const require = createRequire(import.meta.url);

for (const api of [
    await import('@gravity-ui/markdown-viewer'),
    require('@gravity-ui/markdown-viewer'),
]) {
    assert.equal(typeof api.useViewerEffect, 'function');
    assert.equal(api.cnYFM(), 'yfm');
    const result = renderToString(
        createElement(api.MarkdownViewer, {html: '<p>Prepared HTML</p>'}),
    );
    assert.match(result, /<p>Prepared HTML<\/p>/);
}

console.info('Built ESM and CJS exports support SSR without a DOM.');
