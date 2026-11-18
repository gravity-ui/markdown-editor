import {createRequire} from 'node:module';
import {dirname, join} from 'node:path';
import process from 'node:process';

import common from '@markdown-editor/vitest-config';
import {defineConfig, mergeConfig} from 'vitest/config';

const require = createRequire(import.meta.url);
const latex =
    process.env.LATEX_VERSION === '1'
        ? '@diplodoc/latex-extension-v1'
        : '@diplodoc/latex-extension';

export default mergeConfig(
    common,
    defineConfig({
        resolve: {
            alias: [
                {
                    find: '@diplodoc/latex-extension/runtime/styles',
                    replacement: require.resolve(`${latex}/runtime/styles`),
                },
                {
                    find: '@diplodoc/latex-extension/runtime',
                    replacement: join(
                        dirname(require.resolve(`${latex}/runtime`)),
                        'index-browser.js',
                    ),
                },
                {
                    find: '@diplodoc/latex-extension/react',
                    replacement: require.resolve(`${latex}/react`),
                },
            ],
        },
        test: {
            environment: 'jsdom',
            setupFiles: ['./tests/setup.ts'],
        },
    }),
);
