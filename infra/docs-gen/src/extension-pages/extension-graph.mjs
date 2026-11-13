import ts from 'typescript';

import {functionCalls} from './function-calls.mjs';
import {resolveAlias, resolveDeclaration, resolveString} from './symbols.mjs';
import {asFunction, unwrapExpression} from './syntax.mjs';
import {MAX_DEPTH, sortedUnique} from './utils.mjs';

/** Finds the declaration of a name exported from a file, through re-exports. */
export function exportedDeclaration(index, file, name) {
    const {checker} = index;
    const moduleSymbol = checker.getSymbolAtLocation(file);
    const exported = moduleSymbol
        ? checker.getExportsOfModule(moduleSymbol).find((symbol) => symbol.name === name)
        : undefined;

    return resolveAlias(checker, exported)?.valueDeclaration ?? null;
}

/** Checks for a call of `Object.assign`. */
function isObjectAssign(node) {
    return (
        ts.isCallExpression(node) &&
        ts.isPropertyAccessExpression(node.expression) &&
        node.expression.getText() === 'Object.assign'
    );
}

/** Follows `const a = b` and `const a = Object.assign(b, …)` to the declaration with builder calls. */
function builderFunction(index, declaration) {
    let current = declaration;
    for (let depth = 0; current && depth < MAX_DEPTH; depth++) {
        if (ts.isFunctionLike(current)) return current;
        if (!ts.isVariableDeclaration(current)) return null;

        const initializer = unwrapExpression(current.initializer);
        const fn = asFunction(initializer);
        if (fn) return fn;
        const target =
            initializer && isObjectAssign(initializer) ? initializer.arguments[0] : initializer;
        if (!target || !ts.isIdentifier(target)) return null;

        current = resolveDeclaration(index.checker, target);
    }

    return null;
}

/** Lists the extensions passed to `builder.use`. */
function extensionsPassedToUse(call) {
    const argument = unwrapExpression(call.node.arguments[0]);
    if (!argument) return [];

    return ts.isArrayLiteralExpression(argument) ? argument.elements : [argument];
}

/** Collects builder calls of an extension and of every extension it passes to `builder.use`. */
export function collectExtensionCalls(index, declaration) {
    const calls = [];
    const files = new Set();
    const visited = new Set();

    const visit = (node) => {
        const fn = node && builderFunction(index, node);
        if (!fn || visited.has(fn)) return;

        visited.add(fn);
        files.add(fn.getSourceFile().fileName);
        for (const expression of functionCalls(index, fn)) {
            files.add(expression.getSourceFile().fileName);
            const call = index.builderCalls.get(expression);
            if (!call) continue;
            calls.push(call);
            if (call.method !== 'use') continue;
            for (const target of extensionsPassedToUse(call)) {
                visit(resolveDeclaration(index.checker, target));
            }
        }
    };
    visit(declaration);

    return {calls, files};
}

/** Selects calls of one builder method. */
export function callsOf(calls, method) {
    return calls.filter((call) => call.method === method).map((call) => call.node);
}

/** Reads action names from the first argument of `builder.addAction`. */
export function actionNames(index, calls) {
    const names = callsOf(calls, 'addAction').map((call) =>
        resolveString(index, call.arguments[0]),
    );

    return sortedUnique(names.filter((name) => name !== null));
}
