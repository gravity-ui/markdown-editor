import {createElement} from 'react';

import type {
    YfmMermaid,
    YfmMermaidOptions,
    YfmMermaidProps,
    YfmMermaidRuntime,
    YfmMermaidTheme,
} from '@gravity-ui/markdown-viewer-yfm-mermaid-extension' with {'resolution-mode': 'require'};

export function shouldAcceptCommonJsDeclarations(component: typeof YfmMermaid) {
    const runtime: YfmMermaidRuntime = 'mermaid.js';
    const theme: YfmMermaidTheme = 'dark';
    const options: YfmMermaidOptions = {zoom: false};
    const props: YfmMermaidProps = {meta: {script: [runtime]}, runtime, theme, options};
    return createElement(component, props);
}

export function shouldRejectCommonJsAutomaticRendering() {
    const options: YfmMermaidOptions = {
        // @ts-expect-error The viewer owns the render targets.
        startOnLoad: true,
    };
    return options;
}
