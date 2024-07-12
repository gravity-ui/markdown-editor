import {useEffect} from 'react';

import {IHtmlController} from '@diplodoc/html-extension/runtime';
import {useThemeValue} from '@gravity-ui/uikit';

import {setYfmHtmlColors, setYfmHtmlTheme} from './utils';

export const useYfmHtmlTheme = (yfmHtml: IHtmlController) => {
    const theme = useThemeValue();
    useEffect(() => {
        if (yfmHtml) {
            const bodyStyles = window.getComputedStyle(document.body);
            const colorTextPrimary = bodyStyles.getPropertyValue('--g-color-text-primary');
            const colorBackground = bodyStyles.getPropertyValue('--g-color-base-background');

            setYfmHtmlColors(yfmHtml, {
                colorTextPrimary,
                colorBackground,
            });
            setYfmHtmlTheme(yfmHtml, theme);
        }
    }, [theme, yfmHtml]);
};
