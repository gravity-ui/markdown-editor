import type {StorybookConfig} from '@storybook/react-webpack5';

const config:StorybookConfig = {
    framework: {
        name: '@storybook/react-webpack5',
        options: {fastRefresh: true},
    },
    stories: ['../demo/**/*.stories.@(js|jsx|ts|tsx)'],
    addons: [
        '@storybook/preset-scss',
        {name: '@storybook/addon-essentials', options: {backgrounds: false}},
    ],
    typescript: {
        check: true,
    },
};

export default config;
