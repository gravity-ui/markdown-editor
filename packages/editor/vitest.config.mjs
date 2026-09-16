import {fileURLToPath} from 'node:url';

import {defineConfig} from 'vitest/config';

export default defineConfig({
    resolve: {
        alias: {
            '#core': fileURLToPath(new URL('./src/core', import.meta.url)),
            '#cm': fileURLToPath(new URL('./src/cm', import.meta.url)),
            '#pm': fileURLToPath(new URL('./src/pm', import.meta.url)),
            src: fileURLToPath(new URL('./src', import.meta.url)),
        },
    },
    test: {
        environment: 'jsdom',
        globals: false,
        clearMocks: false,
        include: ['src/**/*.test.{ts,tsx}'],
        server: {
            deps: {
                inline: [/@gravity-ui\//, /@diplodoc\//],
            },
        },
        setupFiles: ['./tests/setup.ts'],
        coverage: {
            provider: 'v8',
            include: ['src/**/*.{ts,tsx}'],
            exclude: ['src/**/*.test.{ts,tsx}', 'src/**/*.d.ts'],
        },
    },
});
