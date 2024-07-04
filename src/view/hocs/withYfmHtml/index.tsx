import React, {ComponentType, RefAttributes, forwardRef, useEffect} from 'react';

import {useDiplodocHtml} from '@diplodoc/html-extension/react';

import type {TransformMeta} from './types';

export type WithYfmHtmlProps = {
    meta: TransformMeta;
};

export function withYfmHtml() {
    return <T extends {html: string}>(
        Component: ComponentType<T & RefAttributes<HTMLDivElement>>,
    ) =>
        forwardRef<HTMLDivElement, T & WithYfmHtmlProps>(function WithYfmHtml(props, ref) {
            const yfmHtml = useDiplodocHtml();

            useEffect(() => {
                // FIXME: windew?.[GLOBAL_SYMBOL]?. – https://github.com/diplodoc-platform/html-extension/blob/67432ef4b3cf439320689863c3d540f2daf5651d/src/react/useDiplodocHtml.ts#L6
                yfmHtml.reinitialize();
            }, [yfmHtml]);

            return <Component {...props} ref={ref} />;
        });
}
