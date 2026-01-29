import lib from '@markdown-editor/linters/eslint/lib';
import {defineConfig, globalIgnores} from 'eslint/config';

export default defineConfig(
    globalIgnores(['**/build', '**/coverage', '**/node_modules', '**/storybook-static']),
    lib,
);
