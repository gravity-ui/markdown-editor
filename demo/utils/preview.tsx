import React from 'react';
import {Story, StoryContext} from '@storybook/react/types-6-0';
import {configure as configureUikit, useTheme, ThemeProvider, Theme} from '@gravity-ui/uikit';
import {configure as configureYfmEditor} from '../../src';

import '@gravity-ui/uikit/styles/styles.scss';

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

export function withLang(StoryItem: Story, context: StoryContext) {
    const lang = context.globals.lang;
    configureUikit({lang});
    configureYfmEditor({lang});

    return <StoryItem {...context} />;
}
