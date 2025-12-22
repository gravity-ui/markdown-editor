import {resolve, dirname} from 'node:path';
import {fileURLToPath} from 'node:url';
import {createRequire} from 'node:module';
import webpack from 'webpack';
import type {StorybookConfig} from '@storybook/react-webpack5';

const require = createRequire(import.meta.url);
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const pkg = require('../package.json');
const tsConfig = require('../tsconfig.json');

const config: StorybookConfig = {
    framework: {
        name: '@storybook/react-webpack5',
        options: {},
    },
    stories: ['../demo/**/*.mdx', '../demo/**/*.stories.@(js|jsx|ts|tsx)'],
    addons: [
        './addons/generateDocs.ts',
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

        const baseUrl = resolve(__dirname, '..', tsConfig.compilerOptions.baseUrl);
        const paths = tsConfig.compilerOptions.paths;

        for (const alias in paths) {
            config.resolve.alias[alias] = resolve(baseUrl, paths[alias][0]);
        }

        config.resolve.alias['demo/*'] = resolve(__dirname, '..', 'demo/*');

        return config;
    },
};

export default config;
