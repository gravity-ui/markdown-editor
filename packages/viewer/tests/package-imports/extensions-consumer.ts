import assert from 'node:assert/strict';

import {createElement} from 'react';

import {GalleryProvider} from '@gravity-ui/components';
import {Toaster, ToasterProvider} from '@gravity-ui/uikit';
import {renderToString} from 'react-dom/server';

import {MarkdownViewer} from '@gravity-ui/markdown-viewer';
import {FilesGallery, YfmCodeBlockActions} from '@gravity-ui/markdown-viewer/extensions';

assert.equal(typeof document, 'undefined');

assert.equal(typeof YfmCodeBlockActions, 'function');
assert.equal(typeof FilesGallery, 'function');
const html =
    '<div class="yfm-clipboard"><pre><code>Prepared code</code></pre></div><img src="image.png" alt="Image">';
const result = renderToString(
    createElement(
        ToasterProvider,
        {toaster: new Toaster()},
        createElement(
            GalleryProvider,
            null,
            createElement(
                MarkdownViewer,
                {html},
                createElement(YfmCodeBlockActions, {lineWrappingButton: true}),
                createElement(FilesGallery, {
                    copyUrl: () => assert.fail('Gallery callbacks must not run on the server'),
                }),
            ),
        ),
    ),
);
assert.ok(result.includes(html));
