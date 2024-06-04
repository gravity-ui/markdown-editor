import React from 'react';

import {ThemeProvider, configure} from '@gravity-ui/uikit';
import type {Decorator} from '@storybook/react'; // eslint-disable-line import/no-extraneous-dependencies

import {configure as configureYfmEditor} from '../../src';

import '@gravity-ui/uikit/styles/styles.scss';

export const withThemeProvider: Decorator = (StoryItem, context) => {
    return (
        <ThemeProvider theme={context.globals.theme}>
            <StoryItem {...context} />
        </ThemeProvider>
    );
};

export const withLang: Decorator = (StoryItem, context) => {
    const lang = context.globals.lang;
    configure({lang});
    configureYfmEditor({lang});

    return <StoryItem {...context} />;
};
