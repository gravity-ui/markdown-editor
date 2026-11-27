import {fileURLToPath} from 'node:url';

import common from '@markdown-editor/vitest-config';
import {defineConfig, mergeConfig} from 'vitest/config';

export default mergeConfig(
    common,
    defineConfig({
        resolve: {
            alias: {
                // Keep editor plugins on the same ESM ProseMirror instance.
                'prosemirror-autocomplete': fileURLToPath(
                    new URL(
                        '../packages/editor/node_modules/prosemirror-autocomplete/dist/esm/index.js',
                        import.meta.url,
                    ),
                ),
                'prosemirror-codemark': fileURLToPath(
                    new URL(
                        '../packages/editor/node_modules/prosemirror-codemark/dist/esm/index.js',
                        import.meta.url,
                    ),
                ),
            },
        },
        test: {
            environment: 'jsdom',
            setupFiles: ['./tests/setup.ts'],
        },
    }),
);
