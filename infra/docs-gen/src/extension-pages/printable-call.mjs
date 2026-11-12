import ts from 'typescript';

import {importBinding} from './imports.mjs';
import {unwrapExpression} from './syntax.mjs';

/** Reads the package import of a called function: `null` for other calls. */
function importedCallBinding(index, expression) {
    if (!ts.isCallExpression(expression) || !ts.isIdentifier(expression.expression)) return null;

    const binding = importBinding(index, expression.expression);
    return binding?.isPackage ? binding : null;
}

/**
 * Collects the package imports a value needs.
 * A value is a literal, an object or an array of values, or a call of an imported function with value arguments.
 * Other expressions give `null`.
 */
function valueImports(index, node) {
    const expression = unwrapExpression(node);
    if (
        ts.isStringLiteralLike(expression) ||
        ts.isNumericLiteral(expression) ||
        expression.kind === ts.SyntaxKind.TrueKeyword ||
        expression.kind === ts.SyntaxKind.FalseKeyword ||
        expression.kind === ts.SyntaxKind.NullKeyword
    ) {
        return [];
    }
    if (ts.isPrefixUnaryExpression(expression)) {
        return ts.isNumericLiteral(expression.operand) ? [] : null;
    }
    if (ts.isArrayLiteralExpression(expression)) return listImports(index, expression.elements);
    if (ts.isObjectLiteralExpression(expression)) {
        const isPlain = expression.properties.every(
            (member) => ts.isPropertyAssignment(member) && !ts.isComputedPropertyName(member.name),
        );
        return isPlain
            ? listImports(
                  index,
                  expression.properties.map((member) => member.initializer),
              )
            : null;
    }

    const binding = importedCallBinding(index, expression);
    const argumentImports = binding && listImports(index, expression.arguments);

    return argumentImports ? [binding, ...argumentImports] : null;
}

/** Collects the imports of several values; one value that cannot be printed gives `null`. */
function listImports(index, nodes) {
    const imports = [];
    for (const node of nodes) {
        const found = valueImports(index, node);
        if (!found) return null;
        imports.push(...found);
    }

    return imports;
}

/**
 * Returns the package imports a `use` call needs, or `null` when the call cannot be printed.
 * The plugin is an imported identifier or an imported call; the other arguments are values.
 */
export function useCallImports(index, call) {
    const [plugin, ...rest] = call.arguments;
    if (plugin === undefined) return null;

    const pluginBinding = ts.isIdentifier(plugin) ? importBinding(index, plugin) : null;
    const pluginImports = pluginBinding?.isPackage
        ? [pluginBinding]
        : importedCallBinding(index, unwrapExpression(plugin)) && valueImports(index, plugin);
    const restImports = pluginImports && listImports(index, rest);

    return restImports ? [...pluginImports, ...restImports] : null;
}
