import {
    type ComponentType,
    type RefAttributes,
    type RefObject,
    forwardRef,
    useEffect,
    useRef,
} from 'react';

import {useMermaid} from '@diplodoc/mermaid-extension/react';
import {useForkRef} from '@gravity-ui/uikit';

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

type MermaidRendererProps = WithMermaidProps & {
    containerRef: RefObject<HTMLDivElement>;
    html: string;
    runtime: PluginRuntime;
};

export function withMermaid(opts: WithMermaidOptions) {
    return <T extends {html: string}>(
        Component: ComponentType<T & RefAttributes<HTMLDivElement>>,
    ) =>
        forwardRef<HTMLDivElement, T & WithMermaidProps>(function WithMermaid(props, ref) {
            const {meta, html, mermaidConfig} = props;
            const domRef = useRef<HTMLDivElement>(null);
            const componentRef = useForkRef(ref, domRef);

            return (
                <>
                    <Component {...props} ref={componentRef} />
                    {meta?.script?.includes(opts.runtime) && (
                        <MermaidRenderer
                            containerRef={domRef}
                            html={html}
                            meta={meta}
                            mermaidConfig={mermaidConfig}
                            runtime={opts.runtime}
                        />
                    )}
                </>
            );
        });
}

function MermaidRenderer({containerRef, html, meta, mermaidConfig, runtime}: MermaidRendererProps) {
    const renderMermaid = useMermaid();

    useMermaidRuntime(meta, runtime);

    useEffect(() => {
        const container = containerRef.current;
        if (!container) return;

        // Diagrams inside the editor are managed by its node views.
        const selector = '.mermaid:not(.g-md-wysiwyg-editor .mermaid)';
        const nodes = Array.from(container.querySelectorAll<HTMLElement>(selector));
        if (container.matches(selector)) {
            nodes.unshift(container);
        }

        if (nodes.length) {
            renderMermaid(mermaidConfig, {nodes});
        }
    }, [containerRef, html, mermaidConfig, renderMermaid]);

    return null;
}
