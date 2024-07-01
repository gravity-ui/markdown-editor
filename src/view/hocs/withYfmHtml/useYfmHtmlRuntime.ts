/** @internal */
export function useYfmHtmlRuntime() {
    import(/* webpackChunkName: "yfm-html-runtime" */ '@diplodoc/html-extension/runtime');
}
