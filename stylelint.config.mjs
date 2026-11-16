/** @type {import('stylelint').Config} */
export default {
    ignoreFiles: [
        '**/dist/**',
        '**/build/**',
        '**/coverage/**',
        '**/node_modules/**',
        '**/storybook-static/**',
        '**/.cache*/**',
    ],
    extends: ['@markdown-editor/linters/stylelint'],
};
