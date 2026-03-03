import {createRequire} from 'node:module';

import type {StorybookConfig} from '@storybook/react-webpack5';
import webpack from 'webpack';

import {generateDocs} from './generateDocs';

// generate documentation before initialization
await generateDocs();

const require = createRequire(import.meta.url);

import pkg from '../../packages/editor/package.json' with {type: 'json'};

const config: StorybookConfig = {
    framework: {
        name: '@storybook/react-webpack5',
        options: {},
    },
    stories: ['../src/**/*.mdx', '../src/**/*.stories.@(js|jsx|ts|tsx)'],
    addons: [
        '@storybook/preset-scss',
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
            new webpack.ProvidePlugin({
                process: 'process/browser',
            }),
        );

        config.resolve ||= {};
        config.resolve.alias ||= {};
        config.resolve.fallback ||= {};

        // Node.js polyfills for browser
        config.resolve.fallback = {
            ...config.resolve.fallback,
            fs: false,
            path: require.resolve('path-browserify'),
            url: require.resolve('url/'),
            process: require.resolve('process/browser'),
        };

        config.watchOptions ||= {};
        config.watchOptions.ignored = /node_modules([\\]+|\/)+(?!@gravity-ui\/markdown-editor)/;

        return config;
    },
};

export default config;
