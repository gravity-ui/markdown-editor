import webpack from 'webpack';
import type {StorybookConfig} from '@storybook/react-webpack5';
import {execSync} from 'child_process';

import pkg from '../package.json';

const config: StorybookConfig = {
    framework: {
        name: '@storybook/react-webpack5',
        options: {},
    },
    stories: ['../demo/**/*.mdx', '../demo/**/*.stories.@(js|jsx|ts|tsx)'],
    addons: [
        '@storybook/preset-scss',
        {name: '@storybook/addon-essentials', options: {backgrounds: false}},
        '@storybook/addon-webpack5-compiler-babel',
        '@storybook/addon-docs',
    ],
    typescript: {
        check: true,
        reactDocgen: 'react-docgen-typescript',
    },
    webpackFinal(config) {
        // generate demo/docs
        try {
            execSync('node ./.storybook/generateDocs.js', {stdio: 'inherit'});
            console.log('Docs generation completed successfully!');
        } catch (error) {
            console.error('Error generating docs:', error);
            throw error;
        }

        // add DefinePlugin for version
        config.plugins?.push(
            new webpack.DefinePlugin({
                __VERSION__: `'${pkg.version}-storybook'`,
            }),
        );

        return config;
    },
};

export default config;
