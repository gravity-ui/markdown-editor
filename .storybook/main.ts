import {resolve} from 'node:path';
import webpack from 'webpack';
import type {StorybookConfig} from '@storybook/react-webpack5';
import pkg from '../package.json';
import tsConfig from '../tsconfig.json';

const config: StorybookConfig = {
    framework: {
        name: '@storybook/react-webpack5',
        options: {},
    },
    stories: ['../demo/**/*.mdx', '../demo/**/*.stories.@(js|jsx|ts|tsx)'],
    addons: [
        './addons/generateDocs',
        '@storybook/preset-scss',
        {name: '@storybook/addon-essentials', options: {backgrounds: false}},
        '@storybook/addon-webpack5-compiler-babel',
        '@storybook/addon-docs',
    ],
    typescript: {
        check: true,
        reactDocgen: 'react-docgen-typescript',
    },
    webpackFinal: (config) => {
        config.plugins?.push(
            new webpack.DefinePlugin({
                __VERSION__: `'${pkg.version}-storybook'`,
            }),
        );

        config.resolve ||= {};
        config.resolve.alias ||= {};

        const baseUrl = resolve(__dirname, '..', tsConfig.compilerOptions.baseUrl);
        const paths = tsConfig.compilerOptions.paths;

        for (const alias in paths) {
            config.resolve.alias[alias] = resolve(baseUrl, paths[alias][0])
        }

        config.resolve.alias['demo/*'] = resolve(__dirname, '..', 'demo/*');

        return config;
    },
};

export default config;
