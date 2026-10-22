import type {HTMLRuntimeConfig} from '@diplodoc/html-extension';
import {useDiplodocEmbeddedContentController} from '@diplodoc/html-extension/react';
import type {IHTMLIFrameElementConfig} from '@diplodoc/html-extension/runtime';
import {setupRuntimeConfig} from '@diplodoc/html-extension/utils';
import {useViewerEffect} from '@gravity-ui/markdown-viewer';

import type {DiplodocHtmlRuntime, TransformMeta} from './types';

interface DiplodocHtmlProps {
    meta?: TransformMeta;
    runtime?: DiplodocHtmlRuntime;
    config?: IHTMLIFrameElementConfig;
    runtimeConfig?: HTMLRuntimeConfig;
    onError?: (error: unknown) => void;
}

// Disable shadow mode for XSS protection.
const defaultRuntimeConfig: HTMLRuntimeConfig = {disabledModes: ['shadow']};

export function DiplodocHtml({
    meta,
    runtime = '_assets/html-extension.js',
    config,
    runtimeConfig = defaultRuntimeConfig,
    onError = console.error,
}: DiplodocHtmlProps) {
    const controller = useDiplodocEmbeddedContentController();
    const hasRuntime = Boolean(meta?.script?.includes(runtime));

    useViewerEffect(
        ({signal}) => {
            if (!hasRuntime) return;

            setupRuntimeConfig(runtimeConfig);
            render().catch((error: unknown) => {
                if (!signal.aborted) onError(error);
            });

            async function render() {
                await import(
                    /* webpackChunkName: "yfm-html-runtime" */ '@diplodoc/html-extension/runtime'
                );
                if (signal.aborted || !controller) return;

                // Do not dispose the shared controller from a viewer.
                await controller.initialize(config);
            }
        },
        [hasRuntime, controller, config, runtimeConfig, onError],
    );

    return null;
}
