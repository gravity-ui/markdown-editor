import common from '@markdown-editor/linters/eslint';
import {defineConfig, globalIgnores} from 'eslint/config';

export default defineConfig(
    globalIgnores([
        '**/dist',
        '**/build',
        '**/coverage',
        '**/node_modules',
        '**/storybook-static',
        '**/.cache*',
    ]),
    common,
    {
        files: ['**/src/**/*.{ts,tsx}'],
        rules: {
            'react-hooks/exhaustive-deps': ['warn', {additionalHooks: '^useViewerEffect$'}],
        },
    },
    {
        files: ['./packages/**/src/**/*'],
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
    },
    {
        files: ['./packages/viewer/tests/**/*'],
        settings: {
            // CI failed import/order checks in these public API tests. Viewer imports
            // are external before a build and internal after it. Keep their group fixed
            // so lint works both in a clean checkout and after a local build.
            'import/internal-regex': '^@gravity-ui/markdown-viewer(?:/|$)',
        },
    },
    {
        files: ['./demo/**/*'],
        languageOptions: {
            parserOptions: {
                project: './demo/tsconfig.json',
            },
        },
        settings: {
            'import/resolver': {
                typescript: {
                    alwaysTryTypes: true,
                    project: './demo/tsconfig.json',
                },
            },
        },
    },
    {
        files: ['./packages/editor/**/*'],
        languageOptions: {
            parserOptions: {
                project: './packages/editor/tsconfig.json',
                tsconfigRootDir: import.meta.dirname,
            },
        },
        settings: {
            'import/resolver': {
                typescript: {
                    alwaysTryTypes: true,
                    project: './packages/editor/tsconfig.json',
                },
            },
        },
    },
    {
        files: ['./packages/page-constructor-extension/**/*'],
        languageOptions: {
            parserOptions: {
                project: './packages/page-constructor-extension/tsconfig.json',
                tsconfigRootDir: import.meta.dirname,
            },
        },
        settings: {
            'import/resolver': {
                typescript: {
                    alwaysTryTypes: true,
                    project: './packages/page-constructor-extension/tsconfig.json',
                },
            },
        },
    },
);
