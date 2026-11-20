import {useLatex} from '@diplodoc/latex-extension/react';
import {inspectViewerNode, useViewerEffect} from '@gravity-ui/markdown-viewer';

import type {YfmLatexOptions, YfmLatexRuntime} from './types';

export interface YfmLatexProps {
    /** Transform metadata. No assets are loaded when it is missing. */
    meta?: {script?: string[]; style?: string[]};
    /** Asset names in metadata. Defaults to `_assets/latex-extension.js` and `.css`. */
    runtime?: YfmLatexRuntime;
    /** Formula selector. Defaults to `.yfm-latex`. React slots are skipped. */
    selector?: string;
    /** Runtime options. Defaults to non-throwing errors in the theme error color. */
    options?: YfmLatexOptions;
    /** Handle active render errors. Defaults to `console.error`. */
    onError?: (error: unknown) => void;
}

const defaultRuntime = {
    script: '_assets/latex-extension.js',
    style: '_assets/latex-extension.css',
};

export function YfmLatex({
    meta,
    runtime = defaultRuntime,
    selector = '.yfm-latex',
    options,
    onError = console.error,
}: YfmLatexProps) {
    const renderLatex = useLatex();

    useViewerEffect(
        ({root, signal}) => {
            const [script, style] =
                typeof runtime === 'string' ? [runtime, runtime] : [runtime.script, runtime.style];
            const hasScript = Boolean(meta?.script?.includes(script));
            const hasStyle = Boolean(meta?.style?.includes(style));
            if (!hasScript && !hasStyle) return;

            render().catch((error: unknown) => {
                if (!signal.aborted) onError(error);
            });

            async function render() {
                await Promise.all([
                    hasScript &&
                        import(
                            /* webpackChunkName: "latex-runtime" */ '@diplodoc/latex-extension/runtime'
                        ),
                    hasStyle &&
                        import(
                            // @ts-expect-error The runtime stylesheet has no types.
                            /* webpackChunkName: "latex-styles" */ '@diplodoc/latex-extension/runtime/styles'
                        ),
                ]);
                if (signal.aborted || !hasScript) return;

                await renderLatex({
                    throwOnError: false,
                    errorColor: 'var(--g-color-text-danger)',
                    ...options,
                    nodes: getTargets(root, selector),
                });
            }
        },
        [meta, runtime, renderLatex, selector, options, onError],
    );

    return null;
}

function getTargets(root: HTMLElement, selector: string) {
    return Array.from(root.querySelectorAll<HTMLElement>(selector)).filter((target) => {
        const info = inspectViewerNode(root, target);
        return info.kind === 'content' && !info.hasSlots;
    });
}
