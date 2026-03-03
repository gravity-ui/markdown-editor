/** @type {import('stylelint').Config} */
export default {
    ignoreFiles: [
        '**/build/**',
        '**/coverage/**',
        '**/node_modules/**',
        '**/storybook-static/**',
        '**/.cache*/**',
    ],
    extends: ['@markdown-editor/linters/stylelint'],
};
