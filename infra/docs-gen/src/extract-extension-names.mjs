#!/usr/bin/env node
import {
    existsSync,
    mkdirSync,
    readFileSync,
    readdirSync,
    statSync,
    writeFileSync,
} from 'node:fs';
import {basename, dirname, join, resolve} from 'node:path';
import {fileURLToPath} from 'node:url';

import ts from 'typescript';

export const REPO_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '../../..');
export const DOCS_GEN_DIR = join(REPO_ROOT, 'tmp/docs-gen');

const EDITOR_PKG_DIR = join(REPO_ROOT, 'packages/editor');
const PAGE_CONSTRUCTOR_EXTENSION_DIR = join(
    REPO_ROOT,
    'packages/page-constructor-extension/src/extension',
);
const EXTENSION_CATEGORIES = ['base', 'behavior', 'markdown', 'yfm', 'additional'];
const EXTENSION_TYPE_NAMES = new Set(['Extension', 'ExtensionAuto', 'ExtensionWithOptions']);

export const EXTENSION_NAME_BLACKLIST = [
    'BaseInputRules',
    'BaseKeymap',
    'BaseStyles',
    'ReactRenderer',
    'SharedState',
    'YfmCut',
];

const EXTENSION_ENTRY_POINTS = [
    {
        id: 'editor',
        kind: 'category-dirs',
        packageDir: EDITOR_PKG_DIR,
        extensionsDir: 'src/extensions',
        categories: EXTENSION_CATEGORIES,
    },
    {
        id: 'page-constructor-extension',
        kind: 'single-extension',
        extensionDir: PAGE_CONSTRUCTOR_EXTENSION_DIR,
        extensionName: 'YfmPageConstructorExtension',
    },
];

function parseSource(content, fileName = 'source.tsx') {
    return ts.createSourceFile(fileName, content, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
}

function forEachNode(root, callback) {
    const visit = (node) => {
        callback(node);
        ts.forEachChild(node, visit);
    };

    visit(root);
}

function unwrapExpression(expression) {
    let current = expression;

    while (
        ts.isParenthesizedExpression(current) ||
        ts.isAsExpression(current) ||
        ts.isSatisfiesExpression(current) ||
        ts.isNonNullExpression(current) ||
        ts.isTypeAssertionExpression(current)
    ) {
        current = current.expression;
    }

    return current;
}

function getTypeReferenceName(typeName) {
    if (ts.isIdentifier(typeName)) return typeName.text;
    if (ts.isQualifiedName(typeName)) return typeName.right.text;

    return null;
}

function isExtensionType(typeNode) {
    return (
        typeNode &&
        ts.isTypeReferenceNode(typeNode) &&
        EXTENSION_TYPE_NAMES.has(getTypeReferenceName(typeNode.typeName))
    );
}

function hasExportModifier(node) {
    return ts.getModifiers(node)?.some((modifier) => modifier.kind === ts.SyntaxKind.ExportKeyword);
}

function isObjectAssignFromKnownExtension(initializer, extensionImplementations) {
    if (!initializer) return false;

    const current = unwrapExpression(initializer);
    if (!ts.isCallExpression(current) || !ts.isPropertyAccessExpression(current.expression)) {
        return false;
    }

    const callee = current.expression;
    if (
        !ts.isIdentifier(callee.expression) ||
        callee.expression.text !== 'Object' ||
        callee.name.text !== 'assign'
    ) {
        return false;
    }

    const firstArg = current.arguments[0];
    return (
        Boolean(firstArg) &&
        ts.isIdentifier(firstArg) &&
        extensionImplementations.has(firstArg.text)
    );
}

function readVariableDeclarations(sourceFile) {
    const declarations = [];

    forEachNode(sourceFile, (node) => {
        if (!ts.isVariableStatement(node)) return;

        for (const declaration of node.declarationList.declarations) {
            if (ts.isIdentifier(declaration.name)) {
                declarations.push({statement: node, declaration});
            }
        }
    });

    return declarations;
}

function unique(values) {
    return [...new Set(values.filter(Boolean))];
}

export function extractExtensionNamesFromSource(content, fileName) {
    const sourceFile = parseSource(content, fileName);
    const declarations = readVariableDeclarations(sourceFile);
    const extensionImplementations = new Set(
        declarations
            .filter(({declaration}) => isExtensionType(declaration.type))
            .map(({declaration}) => declaration.name.text),
    );
    const names = [];

    for (const {statement, declaration} of declarations) {
        if (!hasExportModifier(statement)) continue;

        if (
            isExtensionType(declaration.type) ||
            isObjectAssignFromKnownExtension(declaration.initializer, extensionImplementations)
        ) {
            names.push(declaration.name.text);
        }
    }

    return unique(names);
}

export function filterExtensionNames(names, blacklist = EXTENSION_NAME_BLACKLIST) {
    const blockedNames = new Set(blacklist);

    return names.filter((name) => !blockedNames.has(name));
}

function startsWithUppercaseLetter(name) {
    const firstChar = name.charAt(0);

    return (
        firstChar !== '' &&
        firstChar === firstChar.toUpperCase() &&
        firstChar !== firstChar.toLowerCase()
    );
}

function listExtensionDirs(dir) {
    if (!existsSync(dir)) return [];

    return readdirSync(dir)
        .filter((name) => {
            const fullPath = join(dir, name);
            return statSync(fullPath).isDirectory() && startsWithUppercaseLetter(name);
        })
        .map((name) => join(dir, name))
        .sort();
}

function readSourceFiles(dir) {
    if (!existsSync(dir)) return [];

    const files = [];
    for (const entry of readdirSync(dir, {withFileTypes: true})) {
        const fullPath = join(dir, entry.name);

        if (entry.isDirectory()) {
            files.push(...readSourceFiles(fullPath));
        } else if (entry.isFile() && (entry.name.endsWith('.ts') || entry.name.endsWith('.tsx'))) {
            files.push({path: fullPath, content: readFileSync(fullPath, 'utf-8')});
        }
    }

    return files.sort((left, right) => left.path.localeCompare(right.path));
}

function extractExpectedExtensionName(extensionDir, expectedName = basename(extensionDir)) {
    const names = unique(
        readSourceFiles(extensionDir).flatMap((file) =>
            extractExtensionNamesFromSource(file.content, file.path),
        ),
    );

    return names.includes(expectedName) ? expectedName : null;
}

function collectCategoryExtensionNames(entryPoint) {
    const names = [];
    const extensionsRoot = join(entryPoint.packageDir, entryPoint.extensionsDir);

    for (const category of entryPoint.categories) {
        const categoryDir = join(extensionsRoot, category);

        for (const extensionDir of listExtensionDirs(categoryDir)) {
            names.push(extractExpectedExtensionName(extensionDir));
        }
    }

    return names;
}

function collectSingleExtensionName(entryPoint) {
    return [extractExpectedExtensionName(entryPoint.extensionDir, entryPoint.extensionName)];
}

export function collectExtensionNames(entryPoints = EXTENSION_ENTRY_POINTS) {
    const names = entryPoints.flatMap((entryPoint) => {
        if (entryPoint.kind === 'category-dirs') return collectCategoryExtensionNames(entryPoint);
        if (entryPoint.kind === 'single-extension') return collectSingleExtensionName(entryPoint);

        return [];
    });

    return filterExtensionNames(unique(names));
}

function writeExtensionNames(outDir, names) {
    mkdirSync(outDir, {recursive: true});
    writeFileSync(
        join(outDir, 'extensions.json'),
        `${JSON.stringify({extensions: names}, null, 2)}\n`,
    );
}

export function main() {
    writeExtensionNames(DOCS_GEN_DIR, collectExtensionNames());
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
    main();
}
