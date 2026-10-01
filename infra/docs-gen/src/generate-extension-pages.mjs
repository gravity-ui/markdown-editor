import {existsSync, mkdirSync, readFileSync, readdirSync, rmSync, writeFileSync} from 'node:fs';
import {basename, dirname, join, relative, resolve} from 'node:path';
import process from 'node:process';
import {fileURLToPath} from 'node:url';

import ts from 'typescript';

import {extractExtensionNamesFromSource} from './extension-ast.mjs';

const REPO_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '../../..');
const CATEGORIES = ['additional', 'base', 'behavior', 'markdown', 'yfm'];

function sourceFiles(dir) {
    return readdirSync(dir)
        .filter((file) => /\.(ts|tsx)$/.test(file) && !file.endsWith('.test.ts'))
        .sort();
}

function readExtension(dir, root, expectedName = basename(dir)) {
    const candidates = sourceFiles(dir).flatMap((file) => {
        const path = join(dir, file);
        const names = extractExtensionNamesFromSource(readFileSync(path, 'utf8'), path);
        return names.map((name) => ({name, source: relative(root, path)}));
    });
    const extension = candidates.find(
        ({name}) => name === expectedName || name === `${expectedName}Extension`,
    );

    if (extension) return extension;

    const indexPath = join(dir, 'index.ts');
    if (existsSync(indexPath)) {
        const source = ts.createSourceFile(
            indexPath,
            readFileSync(indexPath, 'utf8'),
            ts.ScriptTarget.Latest,
            true,
        );
        if (source.statements.some(ts.isExportDeclaration)) {
            return {name: expectedName, source: relative(root, indexPath)};
        }
    }

    return null;
}

/**
 * Finds one public extension for each extension directory.
 * @param {string} root
 * @returns {{name: string, source: string}[]}
 */
export function discoverExtensions(root = REPO_ROOT) {
    const extensions = [];
    const editorDir = join(root, 'packages/editor/src/extensions');

    for (const category of CATEGORIES) {
        const categoryDir = join(editorDir, category);
        const categoryIndex = join(categoryDir, 'index.ts');
        if (existsSync(categoryIndex)) {
            const names = extractExtensionNamesFromSource(
                readFileSync(categoryIndex, 'utf8'),
                categoryIndex,
            );
            extensions.push(
                ...names.map((name) => ({name, source: relative(root, categoryIndex)})),
            );
        }
        for (const entry of readdirSync(categoryDir, {withFileTypes: true})) {
            if (!entry.isDirectory()) continue;
            const extension = readExtension(join(categoryDir, entry.name), root);
            if (extension) extensions.push(extension);
        }
    }

    extensions.push(
        readExtension(
            join(root, 'packages/page-constructor-extension/src/extension'),
            root,
            'YfmPageConstructorExtension',
        ),
    );
    return extensions.sort((a, b) => a.name.localeCompare(b.name));
}

/**
 * Generates temporary pages for every discovered extension.
 * @param {string} root
 * @returns {{name: string, source: string}[]}
 */
export function generateExtensionPages(root = REPO_ROOT) {
    const outDir = join(root, 'tmp/docs-gen/stubs');
    rmSync(outDir, {recursive: true, force: true});
    mkdirSync(outDir, {recursive: true});
    const extensions = discoverExtensions(root);

    for (const {name} of extensions) {
        writeFileSync(join(outDir, `${name}.md`), `##### Extensions / ${name}\n\n# ${name}\n`);
    }

    return extensions;
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
    const extensions = generateExtensionPages();
    process.stdout.write(`Found ${extensions.length} extensions.\n`);
}
