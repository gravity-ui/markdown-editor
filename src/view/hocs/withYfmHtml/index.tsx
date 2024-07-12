import React, {ComponentType, RefAttributes, forwardRef, useEffect} from 'react';

import {useDiplodocHtml} from '@diplodoc/html-extension/react';
import {useThemeValue} from '@gravity-ui/uikit';

import type {TransformMeta} from './types';
import {useYfmHtmlRuntime} from './useYfmHtmlRuntime';
import {setYfmHtmlColors, setYfmHtmlTheme} from './utils';

export type WithYfmHtmlProps = {
    meta: TransformMeta;
};

export function withYfmHtml() {
    return <T extends {html: string}>(
        Component: ComponentType<T & RefAttributes<HTMLDivElement>>,
    ) =>
        forwardRef<HTMLDivElement, T & WithYfmHtmlProps>(function WithYfmHtml(props, ref) {
            const {html} = props;

            useYfmHtmlRuntime();

            const yfmHtml = useDiplodocHtml();
            const theme = useThemeValue();

            useEffect(() => {
                if (yfmHtml) {
                    yfmHtml.setConfig({
                        resizePadding: 50,
                    });
                    yfmHtml.reinitialize();

                    const bodyStyles = window.getComputedStyle(document.body);
                    const colorTextPrimary = bodyStyles.getPropertyValue('--g-color-text-primary');
                    const colorBackground = bodyStyles.getPropertyValue(
                        '--g-color-base-background',
                    );

                    setYfmHtmlColors(yfmHtml, {
                        colorTextPrimary,
                        colorBackground,
                    });
                    setYfmHtmlTheme(yfmHtml, theme);
                }
            }, [yfmHtml, html, theme]);

            return <Component {...props} ref={ref} />;
        });
}
