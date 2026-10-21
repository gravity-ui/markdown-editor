import {useMermaid} from '@diplodoc/mermaid-extension/react';
import {VIEWER_SLOT_ATTRIBUTE, useViewerEffect} from '@gravity-ui/markdown-viewer';
import {useThemeType} from '@gravity-ui/uikit';

import {cn} from '../cn';

import type {
    DiplodocMermaidOptions,
    DiplodocMermaidRuntime,
    DiplodocMermaidTheme,
    TransformMeta,
} from './types';

import './DiplodocMermaid.css';

interface DiplodocMermaidProps {
    meta?: TransformMeta;
    runtime?: DiplodocMermaidRuntime;
    selector?: string;
    theme?: DiplodocMermaidTheme;
    options?: DiplodocMermaidOptions;
    nonce?: string;
    onError?: (error: unknown) => void;
}

const slotSelector = `[${VIEWER_SLOT_ATTRIBUTE}]`;
const defaultTheme: DiplodocMermaidTheme = {light: 'forest', dark: 'dark'};
let pendingRender = Promise.resolve();

export function DiplodocMermaid({
    meta,
    runtime = '_assets/mermaid-extension.js',
    selector = '.mermaid[data-content]',
    theme = defaultTheme,
    options,
    nonce,
    onError = console.error,
}: DiplodocMermaidProps) {
    const renderMermaid = useMermaid();
    const themeType = useThemeType();
    const diagramTheme = typeof theme === 'string' ? theme : theme[themeType];
    const hasRuntime = Boolean(meta?.script?.includes(runtime));

    useViewerEffect(
        ({root, signal}) => {
            if (!hasRuntime) return undefined;

            let pendingNode: HTMLElement | undefined;
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
                    const slot = target.closest(slotSelector);
                    if (slot && root.contains(slot)) continue;

                    // The runtime owns this child; React slots stay next to it.
                    const node = root.ownerDocument.createElement('div');
                    node.className = cn('mermaid');
                    node.setAttribute('data-content', target.getAttribute('data-content') || '');
                    const previous = target.querySelector(`:scope > .${cn('mermaid')}`);
                    if (previous) {
                        previous.replaceWith(node);
                    } else {
                        target.append(node);
                    }
                    pendingNode = node;
                    await renderMermaid(
                        {...options, theme: diagramTheme, startOnLoad: false},
                        {nodes: [node], nonce},
                    );
                    if (signal.aborted) return;
                    pendingNode = undefined;
                }
            }

            function cleanup() {
                pendingNode?.remove();
            }
        },
        [hasRuntime, renderMermaid, selector, diagramTheme, options, nonce, onError],
    );

    return null;
}
