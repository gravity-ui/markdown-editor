import {dirname, join, resolve} from 'node:path';
import {fileURLToPath} from 'node:url';

export const REPO_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '../../..');
export const DOCS_DIR = join(REPO_ROOT, 'docs');
export const DOCS_SRC_DIR = join(REPO_ROOT, 'tmp/docs-src');
export const DOCS_GEN_DIR = join(REPO_ROOT, 'tmp/docs-gen');
export const EDITOR_PKG_DIR = join(REPO_ROOT, 'packages/editor');

export const GITHUB_RAW_RE =
    /https:\/\/raw\.githubusercontent\.com\/gravity-ui\/markdown-editor\/(?:refs\/heads\/[^/]+|[^/]+)\/docs\//g;
export const HEADER_RE = /^#{5}\s+(.+)$/;

export const EXTENSION_CATEGORIES = ['base', 'behavior', 'markdown', 'yfm', 'additional'];

export const INTERNAL_EXTENSION_BLACKLIST = [
    'BaseInputRules',
    'BaseKeymap',
    'BaseStyles',
    'ReactRenderer',
    'SharedState',
];

export const EXTENSION_BLACKLIST = [
    // Example blacklist entry for generated extension docs.
    'YfmCut',
];

export const EXTENSION_DOC_FIELD_CONFIG = {
    name: {from: 'extension directory name'},
    sourcePath: {from: 'extension directory path relative to repository root'},
    category: {from: 'configured extension category directory'},
    nodes: {from: 'extension spec files: addNode and addNodeSpec calls'},
    marks: {from: 'extension spec files: addMark and addMarkSpec calls'},
    actions: {from: 'extension source files: addAction calls'},
    keymaps: {from: 'extension source files: addKeymap callback return values'},
    inputRules: {from: 'extension source files: input-rule factory calls'},
    plugins: {from: 'extension source files: addPlugin calls'},
    mdPlugins: {from: 'extension source files: markdown-it md.use calls'},
    serializerHints: {from: 'serializer source files: state.write and state.text calls'},
    options: {from: 'extension source files: local *Options TypeScript declarations'},
    markupExamples: {from: 'extension test files: same(...) serializer examples'},
    presets: {from: 'editor preset files: preset builder use(...) calls'},
};

export const PRESET_DEFS = [
    {name: 'ZeroPreset', file: 'zero.ts', parent: null},
    {name: 'CommonMarkPreset', file: 'commonmark.ts', parent: 'ZeroPreset'},
    {name: 'DefaultPreset', file: 'default.ts', parent: 'CommonMarkPreset'},
    {name: 'YfmPreset', file: 'yfm.ts', parent: 'DefaultPreset'},
    {name: 'FullPreset', file: 'full.ts', parent: 'YfmPreset'},
];

/**
 * Checks whether an extension should be skipped by the raw data extractor.
 */
export function isBlacklistedExtension(name) {
    return [...INTERNAL_EXTENSION_BLACKLIST, ...EXTENSION_BLACKLIST].includes(name);
}
