import type {Preview} from '@storybook/react';
import {MINIMAL_VIEWPORTS} from '@storybook/addon-viewport';

import {withThemeProvider, withLang, backgrounds} from '../demo/utils/preview';

const preview: Preview = {
    decorators: [withThemeProvider, withLang],
    parameters: {
        jsx: {showFunctions: true}, // To show functions in sources
        viewport: {
            viewports: MINIMAL_VIEWPORTS,
        },
    },
    globalTypes: {
        theme: {
            defaultValue: 'light',
            toolbar: {
                title: 'Theme',
                icon: 'mirror',
                items: [
                    {value: 'light', right: '☼', title: 'Light'},
                    {value: 'dark', right: '☾', title: 'Dark'},
                    {value: 'light-hc', right: '☼', title: 'High Contrast Light (beta)'},
                    {value: 'dark-hc', right: '☾', title: 'High Contrast Dark (beta)'},
                ],
            },
        },
        lang: {
            defaultValue: 'en',
            toolbar: {
                title: 'Language',
                icon: 'globe',
                items: [
                    {value: 'en', right: '🇬🇧', title: 'En'},
                    {value: 'ru', right: '🇷🇺', title: 'Ru'},
                ],
            },
        },
    },
};

export default preview;
