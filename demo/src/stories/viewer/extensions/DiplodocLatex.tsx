import {useLatex} from '@diplodoc/latex-extension/react';
import {VIEWER_SLOT_ATTRIBUTE, useViewerEffect} from '@gravity-ui/markdown-viewer';

import type {DiplodocLatexOptions, DiplodocLatexRuntime, TransformMeta} from './types';

interface DiplodocLatexProps {
    meta?: TransformMeta;
    runtime?: DiplodocLatexRuntime;
    selector?: string;
    options?: DiplodocLatexOptions;
    onError?: (error: unknown) => void;
}

const slotSelector = `[${VIEWER_SLOT_ATTRIBUTE}]`;
const defaultRuntime = {
    script: '_assets/latex-extension.js',
    style: '_assets/latex-extension.css',
};

export function DiplodocLatex({
    meta,
    runtime = defaultRuntime,
    selector = '.yfm-latex',
    options,
    onError = console.error,
}: DiplodocLatexProps) {
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
    return Array.from(root.querySelectorAll<HTMLElement>(selector)).filter(
        (target) =>
            !root.contains(target.closest(slotSelector)) && !target.querySelector(slotSelector),
    );
}
