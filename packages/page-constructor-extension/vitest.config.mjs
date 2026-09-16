import {defineConfig} from 'vitest/config';

export default defineConfig({
    test: {
        environment: 'node',
        globals: false,
        clearMocks: false,
        include: ['src/**/*.test.{ts,tsx}'],
        server: {
            deps: {
                inline: [/@gravity-ui\//, /@diplodoc\//],
            },
        },
    },
});
