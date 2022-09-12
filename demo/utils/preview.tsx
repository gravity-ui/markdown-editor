import React from 'react';
import {Story, StoryContext} from '@storybook/react/types-6-0';
import {useTheme, ThemeProvider, Theme} from '@yandex-cloud/uikit';

import '@yandex-cloud/uikit/styles/styles.scss';

const light = {name: 'light', value: '#FFFFFF'};
const dark = {name: 'dark', value: '#2D2C33'};
export const backgrounds = {
    defaultValue: '#FFFFFF',
    values: [light, dark],
};

/* eslint-disable react-hooks/rules-of-hooks */
export function withTheme(StoryItem: Story, context: StoryContext) {
    const {value} = context.globals.backgrounds;
    const themeValue = value === dark.value ? dark.name : light.name;

    const [theme, setTheme] = useTheme();

    React.useEffect(() => {
        if (theme !== themeValue) {
            setTheme((themeValue as Theme) || 'system');
        }
    }, [theme, themeValue, setTheme]);

    return <StoryItem {...context} />;
}
/* eslint-enable react-hooks/rules-of-hooks */

export function withThemeProvider(StoryItem: Story, context: StoryContext) {
    return (
        <ThemeProvider>
            <StoryItem {...context} />
        </ThemeProvider>
    );
}
