/**
 * English: Extracts markdown examples from serializer tests using TypeScript AST.
 *
 * Русский: Извлекает markdown examples из serializer tests через TypeScript AST.
 */
import ts from 'typescript';

import {forEachNode, parseSource, unwrapExpression} from './ast.mjs';

/**
 * Applies a known string method to a value.
 */
function applyStringMethod(value, method) {
    if (method === 'trim') return value.trim();
    if (method === 'trimStart') return value.trimStart();
    if (method === 'trimEnd') return value.trimEnd();
    return value;
}

/**
 * Resolves a template literal expression.
 */
function resolveTemplateExpression(expression, bindings) {
    let result = expression.head.text;

    for (const span of expression.templateSpans) {
        const value = resolveStringExpression(span.expression, bindings);
        if (value === null) return null;

        result += value + span.literal.text;
    }

    return result;
}

/**
 * Resolves an array join expression.
 */
function resolveArrayJoinExpression(callExpression, bindings) {
    const callee = unwrapExpression(callExpression.expression);
    if (!ts.isPropertyAccessExpression(callee) || callee.name.text !== 'join') return null;

    const arrayExpression = unwrapExpression(callee.expression);
    if (!ts.isArrayLiteralExpression(arrayExpression)) return null;

    const delimiterExpression = callExpression.arguments[0];
    const delimiter = delimiterExpression
        ? resolveStringExpression(delimiterExpression, bindings)
        : ',';
    if (delimiter === null) return null;

    const parts = arrayExpression.elements.map((element) =>
        resolveStringExpression(element, bindings),
    );
    if (parts.some((part) => part === null)) return null;

    return parts.join(delimiter);
}

/**
 * Resolves a string method call.
 */
function resolveStringMethodCall(callExpression, bindings) {
    const callee = unwrapExpression(callExpression.expression);
    if (!ts.isPropertyAccessExpression(callee)) return null;

    const method = callee.name.text;
    if (method === 'join') return resolveArrayJoinExpression(callExpression, bindings);
    if (method !== 'trim' && method !== 'trimStart' && method !== 'trimEnd') return null;

    const value = resolveStringExpression(callee.expression, bindings);
    return value === null ? null : applyStringMethod(value, method);
}

/**
 * Resolves supported string expressions.
 */
function resolveStringExpression(expression, bindings) {
    const current = unwrapExpression(expression);

    if (ts.isStringLiteralLike(current)) return current.text;
    if (ts.isTemplateExpression(current)) return resolveTemplateExpression(current, bindings);
    if (ts.isIdentifier(current)) return bindings.get(current.text) ?? null;
    if (ts.isCallExpression(current)) return resolveStringMethodCall(current, bindings);

    if (ts.isBinaryExpression(current) && current.operatorToken.kind === ts.SyntaxKind.PlusToken) {
        const left = resolveStringExpression(current.left, bindings);
        const right = resolveStringExpression(current.right, bindings);
        return left === null || right === null ? null : left + right;
    }

    return null;
}

/**
 * Collects resolvable string bindings declared before a source position.
 */
function collectStringBindingsBefore(sourceFile, position) {
    const declarations = [];

    forEachNode(sourceFile, (node) => {
        if (!ts.isVariableDeclaration(node) || !ts.isIdentifier(node.name) || !node.initializer) {
            return;
        }

        if (node.getStart(sourceFile) < position) {
            declarations.push(node);
        }
    });

    declarations.sort((left, right) => left.getStart(sourceFile) - right.getStart(sourceFile));

    const bindings = new Map();
    for (const declaration of declarations) {
        const value = resolveStringExpression(declaration.initializer, bindings);
        if (value !== null) {
            bindings.set(declaration.name.text, value);
        }
    }

    return bindings;
}

/**
 * Checks whether a call expression invokes same(...).
 */
function isSameCall(callExpression) {
    const callee = unwrapExpression(callExpression.expression);

    if (ts.isIdentifier(callee)) return callee.text === 'same';
    return ts.isPropertyAccessExpression(callee) && callee.name.text === 'same';
}

/**
 * Extracts markdown examples from serializer test helpers.
 */
export function extractTestExamples(content) {
    const sourceFile = parseSource(content);
    const examples = [];

    forEachNode(sourceFile, (node) => {
        if (!ts.isCallExpression(node) || !isSameCall(node) || node.arguments.length === 0) {
            return;
        }

        const bindings = collectStringBindingsBefore(sourceFile, node.getStart(sourceFile));
        const example = resolveStringExpression(node.arguments[0], bindings);
        if (example !== null) {
            examples.push(example);
        }
    });

    return examples;
}
