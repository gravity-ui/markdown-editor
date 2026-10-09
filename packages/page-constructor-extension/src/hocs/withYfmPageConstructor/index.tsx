import {type ComponentType, type RefAttributes, forwardRef, useRef} from 'react';

import {setRef} from '@gravity-ui/uikit';

import {YFMPageConstructor} from './components';
import type {PageConstructorConfig, PluginRuntime, TransformMeta} from './types';

export type WithYfmPageConstructorOptions = {
    runtime: PluginRuntime;
};

export type WithYfmPageConstructorProps = {
    meta: TransformMeta;
    pcConfig?: PageConstructorConfig;
};

export function withYfmPageConstructor(opts: WithYfmPageConstructorOptions) {
    return <T extends {html: string}>(
        Component: ComponentType<T & RefAttributes<HTMLDivElement>>,
    ) =>
        forwardRef<HTMLDivElement, T & WithYfmPageConstructorProps>(
            function WithYfmPageConstructor(props, ref) {
                const containerRef = useRef<HTMLDivElement>(null);
                const {meta, html, pcConfig} = props;

                return (
                    <>
                        <Component
                            {...props}
                            ref={(elem) => {
                                setRef(ref, elem);
                                setRef(containerRef, elem);
                            }}
                        />
                        <YFMPageConstructor
                            html={html}
                            meta={meta}
                            config={pcConfig}
                            runtime={opts.runtime}
                            containerRef={containerRef}
                        />
                    </>
                );
            },
        );
}
