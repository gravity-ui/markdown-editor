import ts from 'typescript';

import {importBinding} from './imports.mjs';
import {unwrapExpression} from './syntax.mjs';

/**
 * Returns the package imports a `use` call needs, or `null` when the call cannot be printed.
 * The plugin is an imported identifier or an imported call; the other arguments are values.
 * A value is a literal, an object or an array of values, or a call of an imported function with value arguments.
 */
export function useCallImports(index, call) {
    const [plugin, ...rest] = call.arguments;
    if (plugin === undefined) return null;

    const imports = [];
    function isImportedCall(expression) {
        if (!ts.isCallExpression(expression) || !ts.isIdentifier(expression.expression)) {
            return false;
        }
        const binding = importBinding(index, expression.expression);
        if (!binding?.isPackage) return false;

        imports.push(binding);
        return expression.arguments.every(isValue);
    }
    function isValue(node) {
        const expression = unwrapExpression(node);
        if (ts.isPrefixUnaryExpression(expression)) return ts.isNumericLiteral(expression.operand);
        if (ts.isArrayLiteralExpression(expression)) return expression.elements.every(isValue);
        if (ts.isObjectLiteralExpression(expression)) {
            return expression.properties.every(
                (member) =>
                    ts.isPropertyAssignment(member) &&
                    !ts.isComputedPropertyName(member.name) &&
                    isValue(member.initializer),
            );
        }

        return (
            ts.isStringLiteralLike(expression) ||
            ts.isNumericLiteral(expression) ||
            expression.kind === ts.SyntaxKind.TrueKeyword ||
            expression.kind === ts.SyntaxKind.FalseKeyword ||
            expression.kind === ts.SyntaxKind.NullKeyword ||
            isImportedCall(expression)
        );
    }

    const pluginBinding = ts.isIdentifier(plugin) ? importBinding(index, plugin) : null;
    if (pluginBinding?.isPackage) imports.push(pluginBinding);
    const isPlugin = pluginBinding?.isPackage || isImportedCall(unwrapExpression(plugin));

    return isPlugin && rest.every(isValue) ? imports : null;
}
