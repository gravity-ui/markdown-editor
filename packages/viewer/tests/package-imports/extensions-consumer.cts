import assert = require('node:assert/strict');

import react = require('react');

import components = require('@gravity-ui/components');
import reactDomServer = require('react-dom/server');

import viewer = require('@gravity-ui/markdown-viewer');
import extensions = require('@gravity-ui/markdown-viewer/extensions');

assert.equal(typeof document, 'undefined');

assert.equal(typeof extensions.YfmCodeBlockActions, 'function');
assert.equal(typeof extensions.FilesGallery, 'function');
assert.equal(typeof extensions.HeadingAnchors, 'function');
const html =
    '<h2 id="heading">Heading</h2><div class="yfm-clipboard"><pre><code>Prepared code</code></pre></div><img src="image.png" alt="Image">';
const result = reactDomServer.renderToString(
    react.createElement(
        components.GalleryProvider,
        null,
        react.createElement(
            viewer.MarkdownViewer,
            {html},
            react.createElement(extensions.YfmCodeBlockActions, {lineWrappingButton: true}),
            react.createElement(extensions.HeadingAnchors, {
                getHref: () => assert.fail('Heading callbacks must not run on the server'),
            }),
            react.createElement(extensions.FilesGallery, {
                getCopyUrl: () => assert.fail('Gallery callbacks must not run on the server'),
            }),
        ),
    ),
);
assert.ok(result.includes(html));
