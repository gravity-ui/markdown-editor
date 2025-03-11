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
        setupRuntimeConfig(htmlRuntimeConfig);
        import(/* webpackChunkName: "yfm-html-runtime" */ '@diplodoc/html-extension/runtime');
    }
}
