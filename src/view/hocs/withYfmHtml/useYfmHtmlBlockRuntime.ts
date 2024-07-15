import type {PluginRuntime, TransformMeta} from './types';

/** @internal */
export function useYfmHtmlBlockRuntime(
    meta: TransformMeta,
    runtime: PluginRuntime = '_assets/html-extension.js',
) {
    if (meta?.script?.includes(runtime)) {
        import(/* webpackChunkName: "yfm-html-runtime" */ '@diplodoc/html-extension/runtime');
    }
}
