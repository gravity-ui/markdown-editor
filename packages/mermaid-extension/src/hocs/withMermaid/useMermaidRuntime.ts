import type {PluginRuntime, TransformMeta} from './types';

export function useMermaidRuntime(meta: TransformMeta, runtime: PluginRuntime) {
    if (meta?.script?.includes(runtime)) {
        import(/* webpackChunkName: "mermaid-runtime" */ '@diplodoc/mermaid-extension/runtime');
    }
}
