import ts from 'typescript';

export const BUILDER_METHODS = new Set([
    'addAction',
    'addInputRules',
    'addKeymap',
    'configureMd',
    'use',
]);

/** Checks that the receiver of a call has the `ExtensionBuilder` type. */
function isBuilder(checker, receiver) {
    return checker.getTypeAtLocation(receiver).getSymbol()?.getName() === 'ExtensionBuilder';
}

/** Records builder calls by their AST node. */
export function collectBuilderCall(node, {index}) {
    if (
        !ts.isCallExpression(node) ||
        !ts.isPropertyAccessExpression(node.expression) ||
        !BUILDER_METHODS.has(node.expression.name.text) ||
        !isBuilder(index.checker, node.expression.expression)
    ) {
        return;
    }

    index.builderCalls.set(node, {method: node.expression.name.text, node});
}
