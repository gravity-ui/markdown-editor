import ts from 'typescript';

import {projectFunction} from './symbols.mjs';
import {asFunction, unwrapExpression} from './syntax.mjs';

/** Resolves a directly called function: an inline function or an identifier of a project function. */
function calledFunction(index, expression) {
    const node = unwrapExpression(expression);

    return ts.isIdentifier(node) ? projectFunction(index, node) : asFunction(node);
}

/** Lists the calls of a function body in evaluation order with the helper each call runs; uncalled function bodies are skipped. */
function directCalls(index, fn) {
    const calls = [];
    const visit = (node) => {
        if (ts.isFunctionLike(node)) return;
        ts.forEachChild(node, visit);
        if (!ts.isCallExpression(node)) return;

        const target = calledFunction(index, node.expression);
        calls.push({node, target: target?.body ? target : null});
    };
    if (fn.body) visit(fn.body);

    return calls;
}

/** Finds the functions reachable from `fn` and the ones among them that reach a call selected by `isSelected`. */
function reachableFunctions(fn, callsOf, isSelected) {
    const reached = new Set([fn]);
    const selecting = new Set();
    const callers = new Map();
    for (const caller of reached) {
        for (const {node, target} of callsOf(caller)) {
            if (isSelected(node)) selecting.add(caller);
            if (!target) continue;
            if (!callers.has(target)) callers.set(target, []);
            callers.get(target).push(caller);
            reached.add(target);
        }
    }
    for (const selected of selecting) {
        for (const caller of callers.get(selected) ?? []) selecting.add(caller);
    }

    return {reached, selecting};
}

/**
 * Lists the calls selected by `isSelected` in evaluation order, following direct helper calls.
 * The calls of a helper repeat at every call of it; a helper already on the current call path is skipped.
 * `files` holds the files of all reached calls.
 */
export function functionCalls(index, fn, isSelected) {
    const summaries = new Map();
    const callsOf = (target) => {
        if (!summaries.has(target)) summaries.set(target, directCalls(index, target));
        return summaries.get(target);
    };
    const {reached, selecting} = reachableFunctions(fn, callsOf, isSelected);

    const calls = [];
    const active = new Set();
    const visit = (current) => {
        active.add(current);
        for (const {node, target} of callsOf(current)) {
            if (isSelected(node)) calls.push(node);
            if (selecting.has(target) && !active.has(target)) visit(target);
        }
        active.delete(current);
    };
    visit(fn);

    const files = [...reached]
        .filter((target) => callsOf(target).length > 0)
        .map((target) => target.getSourceFile().fileName);

    return {calls, files};
}
