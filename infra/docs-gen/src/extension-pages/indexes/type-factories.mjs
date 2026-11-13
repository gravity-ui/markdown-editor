import ts from 'typescript';

const TYPE_FACTORIES = new Set(['markTypeFactory', 'nodeTypeFactory']);

/** Records the name argument of `const x = nodeTypeFactory(name)` and `markTypeFactory(name)`. */
export function collectTypeFactory(node, {index}) {
    if (!ts.isVariableDeclaration(node) || !node.initializer) return;

    const call = node.initializer;
    if (
        ts.isCallExpression(call) &&
        ts.isIdentifier(call.expression) &&
        TYPE_FACTORIES.has(call.expression.text) &&
        call.arguments.length > 0
    ) {
        index.typeFactories.set(node, call.arguments[0]);
    }
}
