import {fileURLToPath} from 'node:url';

import common from '@markdown-editor/vitest-config';
import {defineConfig, mergeConfig} from 'vitest/config';

export default mergeConfig(
    common,
    defineConfig({
        resolve: {
            alias: {
                '#core': fileURLToPath(new URL('./src/core', import.meta.url)),
                '#cm': fileURLToPath(new URL('./src/cm', import.meta.url)),
                '#pm': fileURLToPath(new URL('./src/pm', import.meta.url)),
                src: fileURLToPath(new URL('./src', import.meta.url)),
                // Use ESM so all plugins share one ProseMirror state module.
                'prosemirror-autocomplete': fileURLToPath(
                    new URL(
                        './node_modules/prosemirror-autocomplete/dist/esm/index.js',
                        import.meta.url,
                    ),
                ),
                'prosemirror-codemark': fileURLToPath(
                    new URL(
                        './node_modules/prosemirror-codemark/dist/esm/index.js',
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
