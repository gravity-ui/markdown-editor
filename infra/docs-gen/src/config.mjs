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

export const INTERNAL_EXTENSIONS = [
    'BaseInputRules',
    'BaseKeymap',
    'BaseStyles',
    'ReactRenderer',
    'SharedState',
];

export const PRESET_DEFS = [
    {name: 'ZeroPreset', file: 'zero.ts', parent: null},
    {name: 'CommonMarkPreset', file: 'commonmark.ts', parent: 'ZeroPreset'},
    {name: 'DefaultPreset', file: 'default.ts', parent: 'CommonMarkPreset'},
    {name: 'YfmPreset', file: 'yfm.ts', parent: 'DefaultPreset'},
    {name: 'FullPreset', file: 'full.ts', parent: 'YfmPreset'},
];

/**
 * Checks whether an extension is internal-only infrastructure.
 */
export function isInternalExtension(name) {
    return INTERNAL_EXTENSIONS.includes(name);
}
