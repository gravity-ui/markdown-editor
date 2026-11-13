import ts from 'typescript';

import {resolveDeclaration} from './symbols.mjs';
import {asFunction, unwrapExpression} from './syntax.mjs';

/** Resolves a directly called function in the indexed sources. */
function calledFunction(index, expression) {
    const node = unwrapExpression(expression);
    if (!ts.isIdentifier(node) && !asFunction(node)) return null;

    const declaration = asFunction(node) ?? resolveDeclaration(index.checker, node);
    if (!declaration || !index.files.has(declaration.getSourceFile().fileName)) return null;

    return ts.isFunctionLike(declaration) ? declaration : asFunction(declaration.initializer);
}

/** Lists calls in evaluation order, following direct helper calls and skipping uncalled function bodies. */
export function functionCalls(index, fn) {
    const calls = [];
    const active = new Set([fn]);
    const visit = (node) => {
        if (ts.isFunctionLike(node)) return;
        ts.forEachChild(node, visit);
        if (!ts.isCallExpression(node)) return;

        calls.push(node);
        const target = calledFunction(index, node.expression);
        if (target?.body && !active.has(target)) {
            active.add(target);
            visit(target.body);
            active.delete(target);
        }
    };
    if (fn.body) visit(fn.body);

    return calls;
}
