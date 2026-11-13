import ts from 'typescript';

import {enclosingScope, returnedExpressions, unwrapExpression} from './syntax.mjs';
import {MAX_DEPTH, hasFlag} from './utils.mjs';

/** Replaces an import or re-export symbol with the symbol it refers to. */
export function resolveAlias(checker, symbol) {
    return symbol && hasFlag(symbol.flags, ts.SymbolFlags.Alias)
        ? checker.getAliasedSymbol(symbol)
        : symbol;
}

/** Finds the declaration an expression refers to, through imports and re-exports. */
export function resolveDeclaration(checker, expression) {
    const symbol = resolveAlias(checker, checker.getSymbolAtLocation(expression));

    return symbol?.valueDeclaration ?? symbol?.declarations?.[0] ?? null;
}

/** Follows identifiers and property accesses to the literal written in a constant or an enum member. */
export function resolveLiteral(index, expression, depth = 0) {
    const node = unwrapExpression(expression);
    if (!node || depth > MAX_DEPTH) return null;
    if (ts.isStringLiteralLike(node) || ts.isRegularExpressionLiteral(node)) return node;
    if (!ts.isIdentifier(node) && !ts.isPropertyAccessExpression(node)) return null;

    const declaration = resolveDeclaration(index.checker, node);
    const initializer = declaration && index.constants.get(declaration);

    return initializer ? resolveLiteral(index, initializer, depth + 1) : null;
}

/** Reads the string value of an expression that resolves to a string literal. */
export function resolveString(index, expression) {
    const literal = resolveLiteral(index, expression);

    return literal && ts.isStringLiteralLike(literal) ? literal.text : null;
}

/** Returns the variable declaration an identifier refers to, local variables and shorthand properties included. */
export function variableDeclaration(checker, expression) {
    const node = unwrapExpression(expression);
    if (!node || !ts.isIdentifier(node)) return null;

    const declaration = ts.isShorthandPropertyAssignment(node.parent)
        ? checker.getShorthandAssignmentValueSymbol(node.parent)?.valueDeclaration
        : resolveDeclaration(checker, node);

    return declaration && ts.isVariableDeclaration(declaration) ? declaration : null;
}

/** Replaces an identifier of a variable with the variable initializer. */
export function followVariable(checker, expression) {
    const node = unwrapExpression(expression);
    const initializer = variableDeclaration(checker, node)?.initializer;

    return initializer ? unwrapExpression(initializer) : node;
}

/** Checks that an expression refers to the given variable declaration. */
export function refersTo(checker, expression, declaration) {
    return variableDeclaration(checker, expression) === declaration;
}

/** Returns the object literals a function returns directly or through a variable. */
export function returnedObjectLiterals(checker, fn) {
    return returnedExpressions(fn)
        .map((expression) => followVariable(checker, expression))
        .filter((expression) => expression && ts.isObjectLiteralExpression(expression));
}

/** Lists the elements of an array literal, or of an array variable together with the values pushed to it. */
export function arrayElements(checker, expression) {
    const node = unwrapExpression(expression);
    if (node && ts.isArrayLiteralExpression(node)) return node.elements;

    const declaration = variableDeclaration(checker, node);
    const initializer = unwrapExpression(declaration?.initializer);
    if (!initializer || !ts.isArrayLiteralExpression(initializer)) return null;

    const pushed = [];
    const visit = (child) => {
        if (
            ts.isCallExpression(child) &&
            ts.isPropertyAccessExpression(child.expression) &&
            child.expression.name.text === 'push' &&
            refersTo(checker, child.expression.expression, declaration)
        ) {
            pushed.push(...child.arguments);
        }
        ts.forEachChild(child, visit);
    };
    visit(enclosingScope(declaration));

    return [...initializer.elements, ...pushed];
}
