import assert from 'node:assert/strict';

import React from 'react';

import {renderToString} from 'react-dom/server';

export function assertServerRender(ThemeProvider, MarkdownViewer, YfmMermaid) {
    const html = '<div class="mermaid" data-content="graph%20TD%3B%20A--%3EB"></div>';
    const result = renderToString(
        <ThemeProvider theme="light">
            <MarkdownViewer html={html}>
                <YfmMermaid meta={{script: ['_assets/mermaid-extension.js']}} />
            </MarkdownViewer>
        </ThemeProvider>,
    );
    assert.ok(result.includes(html));
}
