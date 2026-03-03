import type {Preview} from '@storybook/react-webpack5';
import {MINIMAL_VIEWPORTS} from 'storybook/viewport';

import {withLang} from '../src/hocs/withLang';
import {withThemeProvider} from '../src/hocs/withThemeProvider';
import {withToaster} from '../src/hocs/withToaster';

const preview: Preview = {
    decorators: [withThemeProvider, withLang, withToaster],
    parameters: {
        jsx: {showFunctions: true}, // To show functions in sources
        viewport: {
            options: MINIMAL_VIEWPORTS,
        },
        options: {
            storySort: {
                order: ['Playground', 'Docs', 'Extensions', 'Settings', ['Presets', '*'], '*'],
            },
        },
        controls: {
            exclude: ['withDefaultInitialContent', 'initial'],
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
