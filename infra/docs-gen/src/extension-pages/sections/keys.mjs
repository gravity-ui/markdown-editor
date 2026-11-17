import ts from 'typescript';

import {callsOf} from '../extension-graph.mjs';
import {NOT_RECOGNIZED, codeList, section} from '../markdown.mjs';
import {refersTo, resolveString, returnedObjectLiterals, variableDeclaration} from '../symbols.mjs';
import {asFunction, enclosingScope, propertyName, returnedExpressions} from '../syntax.mjs';
import {sortedUnique} from '../utils.mjs';

/** Reads keys assigned to a keymap variable: `keys['Mod-k'] = command`; a key that is not a string constant gives `null`. */
function assignedKeys(index, declaration) {
    const keys = [];
    const visit = (node) => {
        if (
            ts.isBinaryExpression(node) &&
            node.operatorToken.kind === ts.SyntaxKind.EqualsToken &&
            ts.isElementAccessExpression(node.left) &&
            refersTo(index.checker, node.left.expression, declaration)
        ) {
            keys.push(resolveString(index, node.left.argumentExpression));
        }
        ts.forEachChild(node, visit);
    };
    visit(enclosingScope(declaration));

    return keys;
}

/**
 * Reads the keys of a `builder.addKeymap` callback: object literal keys and keys assigned to the returned variable.
 * A computed key, a spread member and an assigned key that is not a string constant give `null`.
 */
function keymapKeys(index, call) {
    const fn = asFunction(call.arguments[0]);
    if (!fn) return [];

    const literalKeys = returnedObjectLiterals(index.checker, fn)
        .flatMap((object) => object.properties)
        .map((member) => (ts.isSpreadAssignment(member) ? null : propertyName(member)));
    const assigned = returnedExpressions(fn)
        .map((expression) => variableDeclaration(index.checker, expression))
        .filter(Boolean)
        .flatMap((declaration) => assignedKeys(index, declaration));

    return [...literalKeys, ...assigned];
}

/** Renders the string keys bound by the extension keymaps; a binding with an unread key adds a `Not recognized` item after them. */
export function keysSection({index, calls}) {
    const keymapCalls = callsOf(calls, 'addKeymap');
    const allKeys = keymapCalls.flatMap((call) => keymapKeys(index, call));
    const keys = sortedUnique(allKeys.filter((key) => key !== null));
    const unreadable = keys.length > 0 && allKeys.includes(null) ? [`- ${NOT_RECOGNIZED}`] : [];

    return section('### Keys', [...codeList(keys), ...unreadable], keymapCalls.length > 0);
}
