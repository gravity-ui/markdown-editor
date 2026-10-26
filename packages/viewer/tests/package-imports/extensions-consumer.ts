import assert from 'node:assert/strict';

import {createElement} from 'react';

import {renderToString} from 'react-dom/server';

import {MarkdownViewer} from '@gravity-ui/markdown-viewer';
import viewerCjs = require('@gravity-ui/markdown-viewer');
import {YfmCodeBlockActions} from '@gravity-ui/markdown-viewer/extensions';
import extensionsCjs = require('@gravity-ui/markdown-viewer/extensions');

assert.equal(typeof document, 'undefined');

for (const consumer of [
    {MarkdownViewer, YfmCodeBlockActions},
    {
        MarkdownViewer: viewerCjs.MarkdownViewer,
        YfmCodeBlockActions: extensionsCjs.YfmCodeBlockActions,
    },
]) {
    assert.equal(typeof consumer.YfmCodeBlockActions, 'function');
    const html = '<div class="yfm-clipboard"><pre><code>Prepared code</code></pre></div>';
    const result = renderToString(
        createElement(
            consumer.MarkdownViewer,
            {html},
            createElement(consumer.YfmCodeBlockActions, {lineWrappingButton: true}),
        ),
    );
    assert.ok(result.includes(html));
}
