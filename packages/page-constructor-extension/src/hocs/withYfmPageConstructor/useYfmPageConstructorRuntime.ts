/** @internal */
export function useYfmPageConstructorRuntime() {
    import(
        /* webpackChunkName: "page-constructor-runtime" */ '@diplodoc/page-constructor-extension/runtime'
    );
}
