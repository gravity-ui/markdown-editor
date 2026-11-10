import type {PluginRuntime, TransformMeta} from './types';

/** @internal */
export function useMermaidRuntime(meta: TransformMeta, runtime: PluginRuntime) {
    const script = runtime;

    if (meta?.script?.includes(script)) {
        import(/* webpackChunkName: "mermaid-runtime" */ '@diplodoc/mermaid-extension/runtime');
    }
}
