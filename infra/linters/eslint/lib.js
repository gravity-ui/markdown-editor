import clientConfig from '@gravity-ui/eslint-config/client';
import {defineConfig} from 'eslint/config';
import reactPlugin from 'eslint-plugin-react';

import common from './common.js';

export default defineConfig(common, clientConfig, reactPlugin.configs.flat['jsx-runtime'], {
    rules: {
        'new-cap': [
            2,
            {
                capIsNew: false,
            },
        ],
        '@typescript-eslint/no-namespace': [
            2,
            {
                allowDeclarations: true,
            },
        ],
    },
});
