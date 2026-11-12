import ts from 'typescript';

import {unwrapExpression} from '../syntax.mjs';

/** Checks that an initializer is a literal or a reference that can lead to one. */
function isLiteralSource(expression) {
    const node = unwrapExpression(expression);

    return (
        ts.isStringLiteralLike(node) ||
        ts.isRegularExpressionLiteral(node) ||
        ts.isIdentifier(node) ||
        ts.isPropertyAccessExpression(node)
    );
}

/** Records initializers of variables, enum members and object properties by their declaration. */
export function collectConstant(node, {index}) {
    const isDeclaration =
        ts.isVariableDeclaration(node) || ts.isEnumMember(node) || ts.isPropertyAssignment(node);
    if (isDeclaration && node.initializer && isLiteralSource(node.initializer)) {
        index.constants.set(node, node.initializer);
    }
}
