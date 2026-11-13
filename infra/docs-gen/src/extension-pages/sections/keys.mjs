import ts from 'typescript';

import {callsOf} from '../extension-graph.mjs';
import {codeList, section} from '../markdown.mjs';
import {refersTo, resolveString, returnedObjectLiterals, variableDeclaration} from '../symbols.mjs';
import {asFunction, enclosingScope, propertyName, returnedExpressions} from '../syntax.mjs';
import {sortedUnique} from '../utils.mjs';

/** Reads string keys assigned to a keymap variable: `keys['Mod-k'] = command`. */
function assignedKeys(index, declaration) {
    const keys = [];
    const visit = (node) => {
        if (
            ts.isBinaryExpression(node) &&
            node.operatorToken.kind === ts.SyntaxKind.EqualsToken &&
            ts.isElementAccessExpression(node.left) &&
            refersTo(index.checker, node.left.expression, declaration)
        ) {
            const key = resolveString(index, node.left.argumentExpression);
            if (key !== null) keys.push(key);
        }
        ts.forEachChild(node, visit);
    };
    visit(enclosingScope(declaration));

    return keys;
}

/** Reads written keys of a `builder.addKeymap` callback: object literal keys and string keys assigned to the returned variable. */
function keymapKeys(index, call) {
    const fn = asFunction(call.arguments[0]);
    if (!fn) return [];

    const literalKeys = returnedObjectLiterals(index.checker, fn)
        .flatMap((object) => object.properties)
        .filter((member) => !ts.isSpreadAssignment(member))
        .map(propertyName)
        .filter((name) => name !== null);
    const assigned = returnedExpressions(fn)
        .map((expression) => variableDeclaration(index.checker, expression))
        .filter(Boolean)
        .flatMap((declaration) => assignedKeys(index, declaration));

    return [...literalKeys, ...assigned];
}

/** Renders the string keys bound by the extension keymaps; computed keys are not listed. */
export function keysSection({index, calls}) {
    const keymapCalls = callsOf(calls, 'addKeymap');
    const keys = sortedUnique(keymapCalls.flatMap((call) => keymapKeys(index, call)));

    return section('### Keys', codeList(keys), keymapCalls.length > 0);
}
