import {dirname, join, resolve} from 'node:path';
import {fileURLToPath} from 'node:url';

export const REPO_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '../../..');
export const DOCS_GEN_DIR = join(REPO_ROOT, 'tmp/docs-gen');
export const EDITOR_EXTENSIONS_DIR = join(REPO_ROOT, 'packages/editor/src/extensions');
export const PAGE_CONSTRUCTOR_EXTENSION_DIR = join(
    REPO_ROOT,
    'packages/page-constructor-extension/src/extension',
);

export const EXTENSION_CATEGORIES = ['base', 'behavior', 'markdown', 'yfm', 'additional'];
export const EXTRA_EXTENSION_DIRS = [PAGE_CONSTRUCTOR_EXTENSION_DIR];
export const EXTENSION_BLACKLIST = [
    'BaseInputRules',
    'BaseKeymap',
    'BaseStyles',
    'ReactRendererExtension',
    'Resizable',
    'SharedState',
    'YfmCut',
];

export const EXTENSION_TYPE_NAMES = new Set(['Extension', 'ExtensionAuto', 'ExtensionWithOptions']);
export const EXTENSION_BUILDER_TYPE_NAMES = new Set(['ExtensionBuilder']);
