import type {HTMLRuntimeConfig} from '@diplodoc/html-extension';
import {setupRuntimeConfig} from '@diplodoc/html-extension/utils';

import type {PluginRuntime, TransformMeta} from './types';

/**
 * Default runtime config with shadow mode disabled for XSS protection.
 */
export const DEFAULT_HTML_RUNTIME_CONFIG: HTMLRuntimeConfig = {
    disabledModes: ['shadow'],
};

/** @internal */
export function useYfmHtmlBlockRuntime(
    meta: TransformMeta,
    runtime: PluginRuntime = '_assets/html-extension.js',
    htmlRuntimeConfig: HTMLRuntimeConfig = DEFAULT_HTML_RUNTIME_CONFIG,
) {
    if (meta?.script?.includes(runtime)) {
        // MAJOR: update html-extension peer on ^2.7.1 and remove optional chain
        setupRuntimeConfig?.(htmlRuntimeConfig);
        import(/* webpackChunkName: "yfm-html-runtime" */ '@diplodoc/html-extension/runtime');
    }
}
