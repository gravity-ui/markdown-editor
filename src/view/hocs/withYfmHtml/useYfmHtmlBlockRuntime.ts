/** @internal */
export function useYfmHtmlBlockRuntime() {
    import(/* webpackChunkName: "yfm-html-runtime" */ '@diplodoc/html-extension/runtime');
}
