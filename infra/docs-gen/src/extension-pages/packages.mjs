import {join} from 'node:path';

import {REPO_ROOT} from '../repo-root.mjs';

/**
 * Packages with extension pages.
 * `discovery` lists extension directories: `categories` reads every directory of a category,
 * `extensions` names each directory and its export.
 * `entries` are the package exports that re-export extensions; without them the import names the directory.
 */
export const EDITOR_PACKAGE = {
    name: '@gravity-ui/markdown-editor',
    dir: 'packages/editor',
    title: 'the editor',
    tsconfig: 'tsconfig.json',
    discovery: {
        categories: ['additional', 'base', 'behavior', 'markdown', 'yfm'],
        categoriesDir: 'extensions',
        exclude: [
            'BaseInputRules',
            'BaseKeymap',
            'BaseStyles',
            'BehaviorPreset',
            'ReactRendererExtension',
            'SharedState',
        ],
    },
    toolbarFiles: ['modules/toolbars/view/items.tsx', 'modules/toolbars/wysiwyg/items.tsx'],
    directiveFile: 'utils/directive.ts',
};

export const PAGE_CONSTRUCTOR_PACKAGE = {
    name: '@gravity-ui/markdown-editor-page-constructor-extension',
    dir: 'packages/page-constructor-extension',
    title: 'the page constructor extension',
    discovery: {
        extensions: [
            {dir: 'extension', name: 'YfmPageConstructorExtension'},
            {dir: 'extension/YfmPageConstructorSpecs', name: 'YfmPageConstructorSpecsExtension'},
        ],
    },
    entries: [
        {subpath: '', file: 'index.ts'},
        {subpath: '/specs', file: 'specs.ts'},
    ],
    toolbarFiles: ['extension/toolbar.ts'],
};

/** Places package directories under a root directory. */
export function packagesAt(root, packages) {
    return packages.map((descriptor) => ({...descriptor, dir: join(root, descriptor.dir)}));
}

/** Packages of the repository. */
export const REPO_PACKAGES = packagesAt(REPO_ROOT, [EDITOR_PACKAGE, PAGE_CONSTRUCTOR_PACKAGE]);

/** Returns the `src` directory of a package. */
export function sourceDir(descriptor) {
    return join(descriptor.dir, 'src');
}

/** Finds the package that contains a file. */
export function packageOf(packages, fileName) {
    return packages.find((descriptor) => fileName.startsWith(sourceDir(descriptor) + '/')) ?? null;
}
