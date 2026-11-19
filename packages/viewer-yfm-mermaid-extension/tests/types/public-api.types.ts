import {type ReactElement, createElement} from 'react';

import {
    YfmMermaid,
    type YfmMermaidOptions,
    type YfmMermaidProps,
    type YfmMermaidRuntime,
    type YfmMermaidTheme,
} from '../../src';

export function shouldAcceptDefaultProps() {
    const element: ReactElement<YfmMermaidProps> = createElement(YfmMermaid, {});
    return element;
}

export function shouldAcceptThemesAndOptions() {
    const runtime: YfmMermaidRuntime = 'mermaid.js';
    const themes: YfmMermaidTheme[] = ['forest', {light: 'neutral', dark: 'dark'}];
    const options: YfmMermaidOptions = {
        fontFamily: 'monospace',
        flowchart: {curve: 'linear'},
        zoom: {showMenu: true, maximumScale: 3},
    };
    const props: YfmMermaidProps = {
        meta: {script: [runtime]},
        runtime,
        theme: themes[0],
        options,
        selector: '.diagram',
        nonce: 'viewer-styles',
        onError(error) {
            const value: unknown = error;
            return value;
        },
    };
    return createElement(YfmMermaid, props);
}

export function shouldRejectAutomaticRendering() {
    const options: YfmMermaidOptions = {
        // @ts-expect-error The viewer owns the render targets.
        startOnLoad: true,
    };
    return options;
}

export function shouldRejectThemeInOptions() {
    const options: YfmMermaidOptions = {
        // @ts-expect-error Use the theme prop.
        theme: 'dark',
    };
    return options;
}

export function shouldRejectIncompleteThemeMaps() {
    // @ts-expect-error Both UIKit themes need a Mermaid theme.
    const theme: YfmMermaidTheme = {light: 'forest'};
    return theme;
}
