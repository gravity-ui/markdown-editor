import {useEffect, useState} from 'react';

import {useThemeValue} from '@gravity-ui/uikit';

import {IHTMLIFrameElementConfig} from '../../src';
import {getYfmHtmlBlockCssVariables} from '../../src/view/hocs/withYfmHtml/utils';

export const useYfmHtmlBlockStyles = () => {
    const theme = useThemeValue();
    const [config, setConfig] = useState<IHTMLIFrameElementConfig | undefined>();

    useEffect(() => {
        const bodyStyles = window.getComputedStyle(document.body);

        const colorTextPrimary = bodyStyles.getPropertyValue('--g-color-text-primary');
        const colorTextSecondary =
            theme === 'light' || theme === 'light-hc'
                ? bodyStyles.getPropertyValue('--yfm-color-hljs-subst')
                : bodyStyles.getPropertyValue('--g-color-text-primary');
        const colorBackground = bodyStyles.getPropertyValue('--g-color-base-background');
        const fontFamily = bodyStyles.getPropertyValue('--g-font-family-sans');
        const fontSize = bodyStyles.getPropertyValue('--g-text-body-1-font-size');

        setConfig({
            styles: getYfmHtmlBlockCssVariables({
                colorTextPrimary,
                colorTextSecondary,
                colorBackground,
                fontFamily,
                fontSize,
            }),
            classNames: [theme],
            resizePadding: 50,
            resizeDelay: 100,
        });
    }, [theme]);

    return config;
};
