import baseConfig from '@gravity-ui/eslint-config';
import a11yConfig from '@gravity-ui/eslint-config/a11y';
import clientConfig from '@gravity-ui/eslint-config/client';
import importOrderConfig from '@gravity-ui/eslint-config/import-order';
import prettierConfig from '@gravity-ui/eslint-config/prettier';
import {defineConfig} from 'eslint/config';
import lodash from 'eslint-plugin-lodash';
import reactPlugin from 'eslint-plugin-react';

export default defineConfig(
    baseConfig,
    a11yConfig,
    prettierConfig,
    importOrderConfig,
    {
        plugins: {
            lodash,
        },
    },
    {
        rules: {
            'lodash/import-scope': [2, 'method'],
            'jsx-a11y/no-autofocus': 'warn',
        },
    },
    {
        files: ['**/*.ts', '**/*.tsx'],
        rules: {
            '@typescript-eslint/no-import-type-side-effects': 'error',

            '@typescript-eslint/consistent-type-imports': [
                2,
                {
                    fixStyle: 'inline-type-imports',
                },
            ],

            '@typescript-eslint/no-unused-vars': [
                2,
                {
                    argsIgnorePattern: '^_',
                    varsIgnorePattern: '^_',
                    caughtErrors: 'none',
                },
            ],
        },
    },
    {
        files: ['**/src/**/*'],
        extends: [clientConfig, reactPlugin.configs.flat['jsx-runtime']],
    },
);
