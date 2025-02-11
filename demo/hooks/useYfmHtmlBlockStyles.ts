import {useEffect, useState} from 'react';

import type {IHTMLIFrameElementConfig} from '@diplodoc/html-extension/runtime';
import {useThemeValue} from '@gravity-ui/uikit';

import {getYfmHtmlBlockCssVariables} from '../../src/view/hocs/withYfmHtml/utils';

const variablesMapping = {
    colorBackground: '--g-color-base-background',
    colorTextPrimary: '--g-color-text-primary',
    colorTextSecondary: '--g-color-text-secondary',
    fontFamily: '--g-font-family-sans',
    fontSize: '--g-text-body-1-font-size',
};

export const useYfmHtmlBlockStyles = () => {
    const theme = useThemeValue();
    const [config, setConfig] = useState<IHTMLIFrameElementConfig | undefined>();

    useEffect(() => {
        const bodyStyles = window.getComputedStyle(document.body);

        const styles = Object.entries(variablesMapping).reduce(
            (acc, [key, cssVariable]) => {
                acc[key] = bodyStyles.getPropertyValue(cssVariable);
                return acc;
            },
            {} as Record<string, string>,
        );

        setConfig({
            styles: getYfmHtmlBlockCssVariables(styles),
            classNames: [theme],
        });
    }, [theme]);

    return config;
};

export default useYfmHtmlBlockStyles;
