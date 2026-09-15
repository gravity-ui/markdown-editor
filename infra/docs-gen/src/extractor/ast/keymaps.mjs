/**
 * English: AST scanner for static key bindings returned from addKeymap callbacks.
 *
 * Русский: AST-сканер статичных key bindings из callback-ов addKeymap.
 */
import ts from 'typescript';

import {isBuilderMethodCall} from './builder.mjs';
import {
    forEachNode,
    getStaticPropertyName,
    parseSource,
    unique,
    unwrapExpression,
} from './core.mjs';

/**
 * Extracts static keys from an object literal.
 */
function extractObjectLiteralKeys(objectLiteral, knownObjects = new Map()) {
    const keys = [];

    for (const property of objectLiteral.properties) {
        if (ts.isSpreadAssignment(property)) {
            const spreadName = ts.isIdentifier(property.expression)
                ? property.expression.text
                : null;
            if (spreadName && knownObjects.has(spreadName)) {
                keys.push(...knownObjects.get(spreadName));
            }
            continue;
        }

        if (!ts.isPropertyAssignment(property) && !ts.isShorthandPropertyAssignment(property)) {
            continue;
        }

        const key = getStaticPropertyName(property.name);
        if (key) keys.push(key);
    }

    return keys;
}

/**
 * Reads object-literal keys from a return expression or local object reference.
 */
function extractKeymapExpressionKeys(expression, knownObjects = new Map()) {
    const current = unwrapExpression(expression);

    if (ts.isObjectLiteralExpression(current)) {
        return extractObjectLiteralKeys(current, knownObjects);
    }

    if (ts.isIdentifier(current) && knownObjects.has(current.text)) {
        return knownObjects.get(current.text);
    }

    return [];
}

/**
 * Registers one top-level object literal binding from a callback block.
 */
function collectObjectBinding(statement, knownObjects) {
    if (!ts.isVariableStatement(statement)) return;

    for (const declaration of statement.declarationList.declarations) {
        if (!ts.isIdentifier(declaration.name) || !declaration.initializer) continue;

        const initializer = unwrapExpression(declaration.initializer);
        if (ts.isObjectLiteralExpression(initializer)) {
            knownObjects.set(
                declaration.name.text,
                unique(extractObjectLiteralKeys(initializer, knownObjects)),
            );
        }
    }
}

/**
 * Registers a static key assignment into a known object binding.
 */
function collectObjectAssignment(statement, knownObjects) {
    if (!ts.isExpressionStatement(statement)) return;

    const expression = unwrapExpression(statement.expression);
    if (
        !ts.isBinaryExpression(expression) ||
        expression.operatorToken.kind !== ts.SyntaxKind.EqualsToken
    ) {
        return;
    }

    const left = unwrapExpression(expression.left);
    let objectName = null;
    let keyName = null;

    if (ts.isPropertyAccessExpression(left)) {
        objectName = ts.isIdentifier(left.expression) ? left.expression.text : null;
        keyName = left.name.text;
    } else if (ts.isElementAccessExpression(left)) {
        objectName = ts.isIdentifier(left.expression) ? left.expression.text : null;
        keyName = ts.isStringLiteralLike(left.argumentExpression)
            ? left.argumentExpression.text
            : null;
    }

    if (!objectName || !keyName || !knownObjects.has(objectName)) return;

    knownObjects.set(objectName, unique([...knownObjects.get(objectName), keyName]));
}

/**
 * Extracts static key bindings from an addKeymap callback.
 */
function extractKeymapCallbackKeys(callback) {
    const body = unwrapExpression(callback.body);
    if (!ts.isBlock(body)) return extractKeymapExpressionKeys(body);

    const knownObjects = new Map();
    for (const statement of body.statements) {
        collectObjectBinding(statement, knownObjects);
        collectObjectAssignment(statement, knownObjects);

        if (ts.isReturnStatement(statement) && statement.expression) {
            return extractKeymapExpressionKeys(statement.expression, knownObjects);
        }
    }

    return [];
}

/**
 * Extracts static key bindings from addKeymap callbacks.
 */
export function extractKeymaps(content) {
    const sourceFile = parseSource(content);
    const keymaps = [];

    forEachNode(sourceFile, (node) => {
        if (!ts.isCallExpression(node) || !isBuilderMethodCall(node, new Set(['addKeymap']))) {
            return;
        }

        const callback = unwrapExpression(node.arguments[0]);
        if (callback && (ts.isArrowFunction(callback) || ts.isFunctionExpression(callback))) {
            keymaps.push(...extractKeymapCallbackKeys(callback));
        }
    });

    return unique(keymaps);
}
