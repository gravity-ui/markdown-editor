import React, {ComponentType, RefAttributes, forwardRef, useEffect} from 'react';

import {useDiplodocHtml} from '@diplodoc/html-extension/react';
import {SetConfigArgs} from '@diplodoc/html-extension/runtime';

import {useYfmHtmlRuntime} from './useYfmHtmlRuntime';

export type WithYfmHtmlProps = {
    yfmHtmlConfig: SetConfigArgs;
};

export function withYfmHtml() {
    return <T extends {html: string}>(
        Component: ComponentType<T & RefAttributes<HTMLDivElement>>,
    ) =>
        forwardRef<HTMLDivElement, T & WithYfmHtmlProps>(function WithYfmHtml(props, ref) {
            const {html, yfmHtmlConfig} = props;

            useYfmHtmlRuntime();

            const yfmHtml = useDiplodocHtml();

            useEffect(() => {
                if (yfmHtml) {
                    yfmHtml.setConfig(yfmHtmlConfig);
                    yfmHtml.reinitialize();
                }
            }, [yfmHtml, html]);

            return <Component {...props} ref={ref} />;
        });
}
