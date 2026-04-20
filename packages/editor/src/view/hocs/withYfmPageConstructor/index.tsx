import {type ComponentType, type RefAttributes, forwardRef, useEffect} from 'react';

import {usePageConstructor} from '@diplodoc/page-constructor-extension/react';

import type {TransformMeta} from './types';
import {useYfmPageConstructorRuntime} from './useYfmPageConstructorRuntime';

import './withYfmPageConstructor.scss';

export type YfmPageConstructorConfig = {
    theme?: string;
    preMountHook?: (container: HTMLElement) => void;
};

export type WithYfmPageConstructorProps = {
    meta?: TransformMeta;
    yfmPageConstructorConfig?: YfmPageConstructorConfig;
};

export function withYfmPageConstructor() {
    return <T extends {html: string}>(
        Component: ComponentType<T & RefAttributes<HTMLDivElement>>,
    ) =>
        forwardRef<HTMLDivElement, T & WithYfmPageConstructorProps>(
            function WithYfmPageConstructor(props, ref) {
                const {html, yfmPageConstructorConfig} = props;

                const renderPageConstructor = usePageConstructor({
                    theme: yfmPageConstructorConfig?.theme,
                    preMountHook: yfmPageConstructorConfig?.preMountHook,
                });

                useYfmPageConstructorRuntime();

                useEffect(() => {
                    renderPageConstructor();
                }, [html, renderPageConstructor]);

                return <Component {...props} ref={ref} />;
            },
        );
}
