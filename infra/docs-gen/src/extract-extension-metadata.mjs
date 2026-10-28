import {mkdirSync, readFileSync, readdirSync, writeFileSync} from 'node:fs';
import {dirname, join, relative, resolve} from 'node:path';
import process from 'node:process';
import {fileURLToPath} from 'node:url';

import ts from 'typescript';

import {discoverExtensions} from './generate-extension-pages.mjs';

const REPO_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '../../..');
const BUILDER_METHODS = new Set([
    'addAction',
    'addInputRules',
    'addKeymap',
    'addMarkSpec',
    'addMarkSerializerSpec',
    'addMarkdownTokenParserSpec',
    'addNodeSpec',
    'addNodeSerializerSpec',
    'addPlugin',
    'use',
]);

function listSourceFiles(dir) {
    return readdirSync(dir, {withFileTypes: true}).flatMap((entry) => {
        const path = join(dir, entry.name);
        if (entry.isDirectory()) return listSourceFiles(path);
        if (!/\.(ts|tsx)$/.test(entry.name) || /\.(test|spec)\.(ts|tsx)$/.test(entry.name)) {
            return [];
        }
        return [path];
    });
}

function staticStrings(sourceFile) {
    const strings = new Map();
    for (const statement of sourceFile.statements) {
        if (!ts.isVariableStatement(statement)) continue;
        for (const declaration of statement.declarationList.declarations) {
            if (ts.isIdentifier(declaration.name) && declaration.initializer) {
                const value = declaration.initializer;
                if (ts.isStringLiteralLike(value)) strings.set(declaration.name.text, value.text);
            }
        }
    }
    return strings;
}

function isBuilderReceiver(node) {
    if (ts.isIdentifier(node)) return node.text === 'builder';
    return (
        ts.isCallExpression(node) &&
        ts.isPropertyAccessExpression(node.expression) &&
        isBuilderReceiver(node.expression.expression)
    );
}

function readArgument(argument, sourceFile, strings) {
    if (!argument) return {value: null, expression: null};
    if (ts.isStringLiteralLike(argument)) return {value: argument.text, expression: null};
    if (ts.isIdentifier(argument)) {
        return {
            value: strings.get(argument.text) ?? null,
            expression: strings.has(argument.text) ? null : argument.text,
        };
    }
    if (ts.isPropertyAccessExpression(argument)) {
        return {value: null, expression: argument.getText(sourceFile)};
    }
    return {value: null, expression: null};
}

/**
 * Reads builder calls from TypeScript source without executing the extension.
 * @param {string} content
 * @param {string} fileName
 * @returns {{method: string, value: string | null, expression: string | null}[]}
 */
export function extractBuilderCalls(content, fileName = 'source.ts') {
    const sourceFile = ts.createSourceFile(fileName, content, ts.ScriptTarget.Latest, true);
    const strings = staticStrings(sourceFile);
    const calls = [];

    function visit(node) {
        if (
            ts.isCallExpression(node) &&
            ts.isPropertyAccessExpression(node.expression) &&
            isBuilderReceiver(node.expression.expression) &&
            BUILDER_METHODS.has(node.expression.name.text)
        ) {
            const method = node.expression.name.text;
            const argument = node.arguments[0];
            const {value, expression} = readArgument(argument, sourceFile, strings);
            calls.push({
                method,
                value,
                expression,
            });
        }
        ts.forEachChild(node, visit);
    }

    visit(sourceFile);
    return calls;
}

/**
 * Extracts raw metadata for every discovered extension.
 * @param {string} root
 * @returns {{name: string, category: string, source: string, calls: object[]}[]}
 */
export function extractExtensionMetadata(root = REPO_ROOT) {
    return discoverExtensions(root).map(({name, source}) => {
        const sourceDir = dirname(join(root, source));
        const category = source.includes('packages/page-constructor-extension/')
            ? 'page-constructor'
            : source.split('/')[4];
        const calls = listSourceFiles(sourceDir)
            .sort()
            .flatMap((file) =>
                extractBuilderCalls(readFileSync(file, 'utf8'), file).map((call) => ({
                    ...call,
                    source: relative(root, file),
                })),
            );
        return {name, category, source, calls};
    });
}

/**
 * Writes raw AST metadata to a generated JSON file.
 * @param {string} root
 * @returns {string}
 */
export function writeExtensionMetadata(root = REPO_ROOT) {
    const output = join(root, 'tmp/docs-gen/extensions.json');
    mkdirSync(dirname(output), {recursive: true});
    writeFileSync(
        output,
        `${JSON.stringify({extensions: extractExtensionMetadata(root)}, null, 2)}\n`,
    );
    return output;
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
    process.stdout.write(`${writeExtensionMetadata()}\n`);
}
