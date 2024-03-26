import React, {ComponentType, RefAttributes, forwardRef, useEffect} from 'react';

import {useLatex} from '@diplodoc/latex-extension/react';

import type {PluginRuntime, TransformMeta} from './types';
import {useLatexRuntime} from './useLatexRuntime';

export type WithLatexOptions = {
    runtime: PluginRuntime;
};

export type WithLatexProps = {
    meta: TransformMeta;
};

export function withLatex(opts: WithLatexOptions) {
    return <T extends {html: string}>(
        Component: ComponentType<T & RefAttributes<HTMLDivElement>>,
    ) =>
        forwardRef<HTMLDivElement, T & WithLatexProps>(function WithLatex(props, ref) {
            const {meta, html} = props;

            const renderLatex = useLatex();

            useLatexRuntime(meta, opts.runtime);

            useEffect(() => {
                renderLatex({throwOnError: false});
            }, [html, renderLatex]);

            return <Component {...props} ref={ref} />;
        });
}
