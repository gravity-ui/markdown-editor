import type {HTMLRuntimeConfig} from '@diplodoc/html-extension';
import {setupRuntimeConfig} from '@diplodoc/html-extension/utils';

import type {PluginRuntime, TransformMeta} from './types';

/** @internal */
export function useYfmHtmlBlockRuntime(
    meta: TransformMeta,
    runtime: PluginRuntime = '_assets/html-extension.js',
    htmlRuntimeConfig: HTMLRuntimeConfig = {},
) {
    if (meta?.script?.includes(runtime)) {
        // MAJOR: update html-extension peer on ^2.7.1 and remove optional chain
        setupRuntimeConfig?.(htmlRuntimeConfig);
        import(/* webpackChunkName: "yfm-html-runtime" */ '@diplodoc/html-extension/runtime');
    }
}
