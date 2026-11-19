import * as htmlReact from '@diplodoc/html-extension/react';
import type {IHTMLIFrameElementConfig} from '@diplodoc/html-extension/runtime';
import * as htmlUtils from '@diplodoc/html-extension/utils';
import {useViewerEffect} from '@gravity-ui/markdown-viewer';

export type YfmHtmlRuntimeConfig = Parameters<typeof htmlUtils.setupRuntimeConfig>[0];

export type YfmHtmlBlockRuntime = string;

export interface YfmHtmlBlockProps {
    /** Transform metadata. No runtime is loaded when it is missing. */
    meta?: {script?: string[]; style?: string[]};
    /** Asset name to match in metadata. Defaults to `_assets/html-extension.js`. */
    runtime?: YfmHtmlBlockRuntime;
    /**
     * Iframe settings for all new HTML blocks in the document, including blocks in other viewers.
     * Existing blocks keep their settings. Defaults to the runtime settings.
     */
    config?: IHTMLIFrameElementConfig;
    /**
     * Page-wide policy read once when the controller is created. Use the same value in all viewers.
     * Defaults to `{disabledModes: ['shadow']}`. A custom value replaces this default.
     */
    runtimeConfig?: YfmHtmlRuntimeConfig;
    /** Handle active runtime import or initialization errors. Defaults to `console.error`. */
    onError?: (error: unknown) => void;
}

const {useDiplodocEmbeddedContentController} = fromCommonJs(htmlReact);
const {setupRuntimeConfig} = fromCommonJs(htmlUtils);

// Disable shadow mode for XSS protection.
const defaultRuntimeConfig: YfmHtmlRuntimeConfig = {disabledModes: ['shadow']};

export function YfmHtmlBlock({
    meta,
    runtime = '_assets/html-extension.js',
    config,
    runtimeConfig = defaultRuntimeConfig,
    onError = console.error,
}: YfmHtmlBlockProps) {
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

// Node ESM wraps these CommonJS exports in default. require() returns them directly.
// TODO: Use named imports once all supported @diplodoc/html-extension versions
// expose them from ./react and ./utils in both ESM and CommonJS.
function fromCommonJs<T>(module: T & {default?: T}): T {
    return module.default ?? module;
}
