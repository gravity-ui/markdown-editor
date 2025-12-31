import {type ComponentType, type RefAttributes, forwardRef, useEffect} from 'react';

import {useMermaid} from '@diplodoc/mermaid-extension/react';

import type {PluginRuntime, TransformMeta} from './types';
import {useMermaidRuntime} from './useMermaidRuntime';

export type MermaidConfig = Parameters<ReturnType<typeof useMermaid>>[0];

export type WithMermaidOptions = {
    runtime: PluginRuntime;
};

export type WithMermaidProps = {
    meta: TransformMeta;
    mermaidConfig: MermaidConfig;
};

export function withMermaid(opts: WithMermaidOptions) {
    return <T extends {html: string}>(
        Component: ComponentType<T & RefAttributes<HTMLDivElement>>,
    ) =>
        forwardRef<HTMLDivElement, T & WithMermaidProps>(function WithLatex(props, ref) {
            const {meta, html, mermaidConfig} = props;

            const renderMermaid = useMermaid();

            useMermaidRuntime(meta, opts.runtime);

            useEffect(() => {
                renderMermaid(mermaidConfig);
            }, [html, mermaidConfig, renderMermaid]);

            return <Component {...props} ref={ref} />;
        });
}
