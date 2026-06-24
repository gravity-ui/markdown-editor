import {dirname, join, resolve} from 'node:path';
import {fileURLToPath} from 'node:url';

export const REPO_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '../../../..');
export const DOCS_GEN_DIR = join(REPO_ROOT, 'tmp/docs-gen');
export const EDITOR_PKG_DIR = join(REPO_ROOT, 'packages/editor');
export const PAGE_CONSTRUCTOR_EXTENSION_DIR = join(
    REPO_ROOT,
    'packages/page-constructor-extension/src/extension',
);

export const EXTENSION_CATEGORIES = ['base', 'behavior', 'markdown', 'yfm', 'additional'];

export const EXTENSION_ENTRY_POINTS = [
    {
        id: 'editor',
        packageName: '@gravity-ui/markdown-editor',
        kind: 'category-dirs',
        packageDir: EDITOR_PKG_DIR,
        extensionsDir: 'src/extensions',
        categories: EXTENSION_CATEGORIES,
    },
    {
        id: 'page-constructor-extension',
        packageName: '@gravity-ui/markdown-editor-page-constructor-extension',
        kind: 'single-extension',
        extensionDir: PAGE_CONSTRUCTOR_EXTENSION_DIR,
        extensionName: 'YfmPageConstructorExtension',
    },
];
