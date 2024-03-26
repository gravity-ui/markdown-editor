import type {PluginRuntime, TransformMeta} from './types';

/** @internal */
export function useLatexRuntime(meta: TransformMeta, runtime: PluginRuntime) {
    const [script, style] =
        typeof runtime === 'string' ? [runtime, runtime] : [runtime.script, runtime.style];

    if (meta?.script?.includes(script)) {
        import(/* webpackChunkName: "latex-runtime" */ '@diplodoc/latex-extension/runtime');
    }

    if (meta?.style?.includes(style)) {
        // @ts-expect-error // no types for styles
        import(/* webpackChunkName: "latex-styles" */ '@diplodoc/latex-extension/runtime/styles');
    }
}
