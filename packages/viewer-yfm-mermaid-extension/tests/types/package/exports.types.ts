import {createElement} from 'react';

import {
    YfmMermaid,
    type YfmMermaidOptions,
    type YfmMermaidProps,
    type YfmMermaidRuntime,
    type YfmMermaidTheme,
} from '@gravity-ui/markdown-viewer-yfm-mermaid-extension';

export function shouldAcceptPublishedProps() {
    const runtime: YfmMermaidRuntime = 'mermaid.js';
    const theme: YfmMermaidTheme = {light: 'forest', dark: 'dark'};
    const options: YfmMermaidOptions = {zoom: {showMenu: true}};
    const props: YfmMermaidProps = {meta: {script: [runtime]}, runtime, theme, options};
    return createElement(YfmMermaid, props);
}

export function shouldRejectPublishedAutomaticRendering() {
    const options: YfmMermaidOptions = {
        // @ts-expect-error The viewer owns the render targets.
        startOnLoad: true,
    };
    return options;
}
