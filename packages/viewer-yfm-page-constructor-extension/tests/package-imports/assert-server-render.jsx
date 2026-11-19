import assert from 'node:assert/strict';

import React from 'react';

import {renderToString} from 'react-dom/server';

export function assertServerRender(MarkdownViewer, YfmPageConstructor) {
    const html = '<div class="yfm-page-constructor" data-content-encoded="%7B%7D"></div>';
    const result = renderToString(
        <MarkdownViewer html={html}>
            <YfmPageConstructor meta={{script: ['_assets/page-constructor.js']}} />
        </MarkdownViewer>,
    );
    assert.ok(result.includes(html));
}
