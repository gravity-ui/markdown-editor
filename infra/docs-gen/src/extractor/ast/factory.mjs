/**
 * English: Static naming helpers for plugin and factory callback expressions.
 *
 * Русский: Хелперы статического именования plugin/factory callback выражений.
 */
import ts from 'typescript';

import {getExpressionName, unwrapExpression} from './core.mjs';

/**
 * Reads a returned expression from a function-like callback.
 */
function getStaticReturnExpression(callback) {
    const body = callback.body;
    if (!ts.isBlock(body)) return unwrapExpression(body);

    for (const statement of body.statements) {
        if (ts.isReturnStatement(statement)) return statement.expression || null;
    }

    return null;
}

/**
 * Describes a factory callback or plugin expression with a stable identifier.
 */
export function describeFactoryExpression(expression, sourceFile) {
    const current = unwrapExpression(expression);

    if (ts.isIdentifier(current) || ts.isPropertyAccessExpression(current)) {
        return getExpressionName(current, sourceFile);
    }

    if (ts.isCallExpression(current)) {
        return getExpressionName(current.expression, sourceFile);
    }

    if (ts.isNewExpression(current)) {
        return getExpressionName(current.expression, sourceFile);
    }

    if (ts.isArrowFunction(current) || ts.isFunctionExpression(current)) {
        const returned = getStaticReturnExpression(current);
        return returned ? describeFactoryExpression(returned, sourceFile) : null;
    }

    return null;
}
