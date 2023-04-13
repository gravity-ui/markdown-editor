import {withTheme, withThemeProvider, withLang, backgrounds} from '../demo/utils/preview';

export const parameters = {
    actions: {argTypesRegex: '^on[A-Z].*'},
    controls: {
        matchers: {
            color: /(background|color)$/i,
            date: /Date$/,
        },
    },
    theme: {
        values: [
            {name: 'light', value: 'light'},
            {name: 'dark', value: 'dark'},
        ],
    },
    backgrounds,
    globals: {
        backgrounds: {
            value: backgrounds.values[0].value,
        },
    },
};

export const globalTypes = {
    lang: {
        name: 'Language',
        defaultValue: 'en',
        toolbar: {
            icon: 'globe',
            items: [
                {value: 'ru', right: '🇷🇺', title: 'Ru'},
                {value: 'en', right: '🇺🇸', title: 'En'},
            ],
        },
    },
};

export const decorators = [withTheme, withThemeProvider, withLang];
