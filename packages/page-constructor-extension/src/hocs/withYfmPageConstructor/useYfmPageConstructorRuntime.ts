import {useEffect} from 'react';

/** @internal */
export function useYfmPageConstructorRuntime() {
    useEffect(() => {
        import(
            /* webpackChunkName: "page-constructor-runtime" */ '@diplodoc/page-constructor-extension/runtime'
        );
    }, []);
}
