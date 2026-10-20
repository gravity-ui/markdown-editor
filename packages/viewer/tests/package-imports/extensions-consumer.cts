import assert = require('node:assert/strict');

import react = require('react');

import components = require('@gravity-ui/components');
import uikit = require('@gravity-ui/uikit');
import reactDomServer = require('react-dom/server');

import viewer = require('@gravity-ui/markdown-viewer');
import extensions = require('@gravity-ui/markdown-viewer/extensions');

assert.equal(typeof document, 'undefined');

assert.equal(typeof extensions.YfmCodeBlockActions, 'function');
assert.equal(typeof extensions.FilesGallery, 'function');
const html =
    '<div class="yfm-clipboard"><pre><code>Prepared code</code></pre></div><img src="image.png" alt="Image">';
const result = reactDomServer.renderToString(
    react.createElement(
        uikit.ToasterProvider,
        {toaster: new uikit.Toaster()},
        react.createElement(
            components.GalleryProvider,
            null,
            react.createElement(
                viewer.MarkdownViewer,
                {html},
                react.createElement(extensions.YfmCodeBlockActions, {lineWrappingButton: true}),
                react.createElement(extensions.FilesGallery, {
                    copyUrl: () => assert.fail('Gallery callbacks must not run on the server'),
                }),
            ),
        ),
    ),
);
assert.ok(result.includes(html));
