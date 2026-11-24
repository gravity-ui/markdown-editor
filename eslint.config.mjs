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
        // Types describe parameters and results; TSDoc in docs-gen holds only the summary.
        files: ['./infra/docs-gen/**/*'],
        rules: {
            'jsdoc/require-param': 'off',
            'jsdoc/require-param-type': 'off',
            'jsdoc/require-returns': 'off',
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
        files: ['./packages/viewer-yfm-{mermaid,page-constructor}-extension/tests/**/*'],
        settings: {
            'import/internal-regex':
                '^@gravity-ui/markdown-viewer-yfm-(?:mermaid|page-constructor)-extension(?:/|$)',
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
        files: ['./packages/editor-banner-extension/**/*'],
        languageOptions: {
            parserOptions: {
                project: './packages/editor-banner-extension/tsconfig.json',
                tsconfigRootDir: import.meta.dirname,
            },
        },
        settings: {
            'import/resolver': {
                typescript: {
                    alwaysTryTypes: true,
                    project: './packages/editor-banner-extension/tsconfig.json',
                },
            },
        },
    },
    {
        files: ['./packages/editor-section-extension/**/*'],
        languageOptions: {
            parserOptions: {
                project: './packages/editor-section-extension/tsconfig.json',
                tsconfigRootDir: import.meta.dirname,
            },
        },
        settings: {
            'import/resolver': {
                typescript: {
                    alwaysTryTypes: true,
                    project: './packages/editor-section-extension/tsconfig.json',
                },
            },
        },
    },
    {
        files: ['./packages/plugin-banner/**/*'],
        languageOptions: {
            parserOptions: {
                project: './packages/plugin-banner/tsconfig.json',
                tsconfigRootDir: import.meta.dirname,
            },
        },
        settings: {
            'import/resolver': {
                typescript: {
                    alwaysTryTypes: true,
                    project: './packages/plugin-banner/tsconfig.json',
                },
            },
        },
    },
    {
        files: ['./packages/plugin-section/**/*'],
        languageOptions: {
            parserOptions: {
                project: './packages/plugin-section/tsconfig.json',
                tsconfigRootDir: import.meta.dirname,
            },
        },
        settings: {
            'import/resolver': {
                typescript: {
                    alwaysTryTypes: true,
                    project: './packages/plugin-section/tsconfig.json',
                },
            },
        },
    },
);
