import React from 'react';

import {ThemeProvider} from '@gravity-ui/uikit';
import type {Decorator} from '@storybook/react';

import '@gravity-ui/uikit/styles/styles.scss';

export const withThemeProvider: Decorator = (StoryItem, context) => {
    return (
        <ThemeProvider theme={context.globals.theme}>
            <StoryItem {...context} />
        </ThemeProvider>
    );
};
