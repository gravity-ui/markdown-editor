/**
 * English: Helpers for recognizing extension builder call chains in TypeScript AST.
 *
 * Русский: Хелперы для распознавания цепочек вызовов extension builder в TypeScript AST.
 */
import ts from 'typescript';

import {forEachNode, getExpressionName, parseSource, unique, unwrapExpression} from './core.mjs';

const BUILDER_ROOT_NAME = 'builder';

const BUILDER_CHAIN_METHODS = new Set([
    'addAction',
    'addKeymap',
    'addMark',
    'addMarkSpec',
    'addMarkdownTokenParserSpec',
    'addNode',
    'addNodeSerializerSpec',
    'addNodeSpec',
    'addPlugin',
    'configureMd',
]);

/**
 * Checks whether an expression is the root builder or a builder call chain.
 */
function isBuilderExpression(expression) {
    const current = unwrapExpression(expression);

    if (ts.isIdentifier(current)) return current.text === BUILDER_ROOT_NAME;

    if (!ts.isCallExpression(current)) return false;
    if (!ts.isPropertyAccessExpression(current.expression)) return false;
    if (!BUILDER_CHAIN_METHODS.has(current.expression.name.text)) return false;

    return isBuilderExpression(current.expression.expression);
}

/**
 * Checks whether a call is made on the extension builder chain.
 */
export function isBuilderMethodCall(callExpression, methodNames) {
    const expression = unwrapExpression(callExpression.expression);

    return (
        ts.isPropertyAccessExpression(expression) &&
        methodNames.has(expression.name.text) &&
        isBuilderExpression(expression.expression)
    );
}

/**
 * Extracts first arguments from extension builder method calls.
 */
export function extractBuilderCallFirstArgs(content, methodNames) {
    const sourceFile = parseSource(content);
    const names = [];

    forEachNode(sourceFile, (node) => {
        if (!ts.isCallExpression(node) || !isBuilderMethodCall(node, methodNames)) return;

        const firstArg = node.arguments[0];
        const name = firstArg ? getExpressionName(firstArg, sourceFile) : null;
        if (name) names.push(name);
    });

    return unique(names);
}
