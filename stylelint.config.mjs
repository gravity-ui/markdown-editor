/** @type {import('stylelint').Config} */
export default {
    ignoreFiles: ['**/node_modules/**'],
    extends: [
        '@gravity-ui/stylelint-config',
        '@gravity-ui/stylelint-config/order',
        '@gravity-ui/stylelint-config/prettier',
    ],
};
