import {type RefObject, Suspense} from 'react';

import type {PageConstructorConfig, PluginRuntime, TransformMeta} from '../types';

import {YFMPageConstructorRendererLazy} from './YFMPageConstructorRenderer.lazy';

export type YFMPageConstructorProps = {
    html: string;
    meta: TransformMeta;
    runtime: PluginRuntime;
    config?: PageConstructorConfig;
    containerRef: RefObject<HTMLDivElement>;
};

export const YFMPageConstructor: React.FC<YFMPageConstructorProps> = function YFMPageConstructor({
    html,
    meta,
    config,
    runtime,
    containerRef,
}) {
    const PC_SCRIPT = typeof runtime === 'string' ? runtime : runtime.script;
    const hasScript = meta?.script?.includes(PC_SCRIPT);

    if (hasScript) {
        return (
            <Suspense>
                <YFMPageConstructorRendererLazy
                    html={html}
                    config={config}
                    containerRef={containerRef}
                />
            </Suspense>
        );
    }

    return null;
};
