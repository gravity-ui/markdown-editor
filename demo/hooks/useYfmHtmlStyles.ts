import {useEffect, useState} from 'react';

import {useThemeValue} from '@gravity-ui/uikit';

import {getYfmHtmlCssVariables} from '../../src/view/hocs/withYfmHtml/utils';

export const useYfmHtmlStyles = () => {
    const theme = useThemeValue();
    const [config, setConfig] = useState<Record<string, any> | undefined>();

    useEffect(() => {
        const bodyStyles = window.getComputedStyle(document.body);

        const colorTextPrimary = bodyStyles.getPropertyValue('--g-color-text-primary');
        const colorTextSecondary = bodyStyles.getPropertyValue('--g-color-text-secondary');
        const colorBackground = bodyStyles.getPropertyValue('--g-color-base-background');
        const fontFamily = bodyStyles.getPropertyValue('--g-font-family-sans');
        const fontSize = bodyStyles.getPropertyValue('--g-text-body-1-font-size');

        setConfig({
            styles: getYfmHtmlCssVariables({
                colorTextPrimary,
                colorTextSecondary,
                colorBackground,
                fontFamily,
                fontSize,
            }),
            classNames: [theme],
        });
    }, [theme]);

    return config;
};
