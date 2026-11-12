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
            // Keep viewer imports in the same group before and after a build.
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
    {
        files: ['./packages/editor-header-extension/**/*'],
        languageOptions: {
            parserOptions: {
                project: './packages/editor-header-extension/tsconfig.json',
                tsconfigRootDir: import.meta.dirname,
            },
        },
        settings: {
            'import/resolver': {
                typescript: {
                    alwaysTryTypes: true,
                    project: './packages/editor-header-extension/tsconfig.json',
                },
            },
        },
    },
    {
        files: ['./packages/editor-mermaid-extension/**/*'],
        languageOptions: {
            parserOptions: {
                project: './packages/editor-mermaid-extension/tsconfig.json',
                tsconfigRootDir: import.meta.dirname,
            },
        },
        settings: {
            'import/resolver': {
                typescript: {
                    alwaysTryTypes: true,
                    project: './packages/editor-mermaid-extension/tsconfig.json',
                },
            },
        },
    },
    {
        files: ['./packages/plugin-header/**/*'],
        languageOptions: {
            parserOptions: {
                project: './packages/plugin-header/tsconfig.json',
                tsconfigRootDir: import.meta.dirname,
            },
        },
        settings: {
            'import/resolver': {
                typescript: {
                    alwaysTryTypes: true,
                    project: './packages/plugin-header/tsconfig.json',
                },
            },
        },
    },
);
