import {fileURLToPath} from 'node:url';

import common from '@markdown-editor/vitest-config';
import {defineConfig, mergeConfig} from 'vitest/config';

export default mergeConfig(
    common,
    defineConfig({
        resolve: {
            mainFields: ['module'],
            alias: {
                '#core': fileURLToPath(new URL('./src/core', import.meta.url)),
                '#cm': fileURLToPath(new URL('./src/cm', import.meta.url)),
                '#pm': fileURLToPath(new URL('./src/pm', import.meta.url)),
                src: fileURLToPath(new URL('./src', import.meta.url)),
            },
        },
        test: {
            environment: 'jsdom',
            setupFiles: ['./tests/setup.ts'],
            server: {
                deps: {
                    // Use ESM builds so plugin decorations share the editor's ProseMirror classes.
                    inline: [/prosemirror-(codemark|autocomplete)/],
                },
            },
        },
    }),
);
