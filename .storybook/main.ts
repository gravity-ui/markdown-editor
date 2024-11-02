import webpack from 'webpack';
import type {StorybookConfig} from '@storybook/react-webpack5';

import pkg from '../package.json';

const config: StorybookConfig = {
    framework: {
        name: '@storybook/react-webpack5',
        options: {},
    },
    stories: ['../demo/**/*.stories.@(js|jsx|ts|tsx)'],
    addons: [
        '@storybook/preset-scss',
        {name: '@storybook/addon-essentials', options: {backgrounds: false}},
        '@storybook/addon-webpack5-compiler-babel',
    ],
    typescript: {
        check: true,
        reactDocgen: 'react-docgen-typescript'
    },
    webpackFinal(config) {
        config.plugins?.push(
            new webpack.DefinePlugin({
                __VERSION__: `'${pkg.version}-storybook'`,
            }),
        );
        return config;
    },
};

export default config;
