import {useMermaid} from '@diplodoc/mermaid-extension/react';
import {cn, inspectViewerNode, useViewerEffect} from '@gravity-ui/markdown-viewer';
import {useThemeType} from '@gravity-ui/uikit';

import type {YfmMermaidOptions, YfmMermaidRuntime, YfmMermaidTheme} from './types';

import './YfmMermaid.scss';
import '@diplodoc/mermaid-extension/styles/zoom.css';

export interface YfmMermaidProps {
    /** Transform metadata. No runtime is loaded when it is missing. */
    meta?: {script?: string[]; style?: string[]};
    /** Asset name in metadata. Defaults to `_assets/mermaid-extension.js`. */
    runtime?: YfmMermaidRuntime;
    /** Diagram selector. Defaults to `.mermaid[data-content]`. React slots are skipped. */
    selector?: string;
    /** Mermaid theme or UIKit theme map. Defaults to forest in light mode and dark in dark mode. */
    theme?: YfmMermaidTheme;
    /** Mermaid settings, including zoom. Automatic document rendering is disabled. */
    options?: YfmMermaidOptions;
    /** Nonce for SVG styles. No nonce is set by default. */
    nonce?: string;
    /** Handle runtime loading and rendering failures. Diplodoc handles diagram syntax errors. Defaults to `console.error`. */
    onError?: (error: unknown) => void;
}

const b = cn('yfm-mermaid');
const defaultTheme: YfmMermaidTheme = {light: 'forest', dark: 'dark'};
let pendingRender = Promise.resolve();

export function YfmMermaid({
    meta,
    runtime = '_assets/mermaid-extension.js',
    selector = '.mermaid[data-content]',
    theme = defaultTheme,
    options,
    nonce,
    onError = console.error,
}: YfmMermaidProps) {
    const renderMermaid = useMermaid();
    const themeType = useThemeType();
    const diagramTheme = typeof theme === 'string' ? theme : theme[themeType];
    const hasRuntime = Boolean(meta?.script?.includes(runtime));

    useViewerEffect(
        ({root, signal}) => {
            if (!hasRuntime) return undefined;

            let undoPendingRender: (() => void) | undefined;
            const operation = pendingRender.then(render);
            // Keep initialize and the full async run together across viewers.
            pendingRender = operation.catch(() => {});
            operation.catch((error: unknown) => {
                cleanup();
                if (!signal.aborted) onError(error);
            });

            return cleanup;

            async function render() {
                await import(
                    /* webpackChunkName: "mermaid-runtime" */ '@diplodoc/mermaid-extension/runtime'
                );
                if (signal.aborted) return;

                for (const target of Array.from(root.querySelectorAll<HTMLElement>(selector))) {
                    if (inspectViewerNode(root, target).kind !== 'content') continue;

                    // The runtime owns this child; React slots stay next to it.
                    const node = root.ownerDocument.createElement('div');
                    node.className = b();
                    node.setAttribute('data-content', target.getAttribute('data-content') || '');
                    const previous = target.querySelector(`:scope > .${b()}`);
                    if (previous) {
                        previous.replaceWith(node);
                        undoPendingRender = () => {
                            if (node.parentNode === target) node.replaceWith(previous);
                        };
                    } else {
                        target.append(node);
                        undoPendingRender = () => node.remove();
                    }
                    await renderMermaid(
                        {...options, theme: diagramTheme, startOnLoad: false},
                        {nodes: [node], nonce},
                    );
                    if (signal.aborted) return;
                    undoPendingRender = undefined;
                }
            }

            function cleanup() {
                undoPendingRender?.();
                undoPendingRender = undefined;
            }
        },
        [hasRuntime, renderMermaid, selector, diagramTheme, options, nonce, onError],
    );

    return null;
}
