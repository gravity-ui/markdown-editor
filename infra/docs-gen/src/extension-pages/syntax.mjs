import ts from 'typescript';

/** Removes parentheses and `as` casts around an expression. */
export function unwrapExpression(expression) {
    let current = expression;
    while (
        current &&
        (ts.isParenthesizedExpression(current) ||
            ts.isAsExpression(current) ||
            ts.isSatisfiesExpression(current) ||
            ts.isNonNullExpression(current))
    ) {
        current = current.expression;
    }

    return current;
}

/** Returns the function an expression evaluates to: arrow functions and function expressions only. */
export function asFunction(expression) {
    const node = unwrapExpression(expression);

    return node && (ts.isArrowFunction(node) || ts.isFunctionExpression(node)) ? node : null;
}

/** Collects the expressions a function returns. */
export function returnedExpressions(fn) {
    if (!fn.body) return [];
    if (!ts.isBlock(fn.body)) return [fn.body];

    const results = [];
    forEachInFunction(fn, (node) => {
        if (ts.isReturnStatement(node) && node.expression) results.push(node.expression);
    });

    return results;
}

/** Visits the nodes of a function body; nested functions are skipped. */
export function forEachInFunction(fn, onNode) {
    const visit = (node) => {
        if (ts.isFunctionLike(node)) return;
        onNode(node);
        ts.forEachChild(node, visit);
    };
    if (fn.body) ts.forEachChild(fn.body, visit);
}

/** Returns the function or the file that contains a node. */
export function enclosingScope(node) {
    return ts.findAncestor(
        node.parent,
        (ancestor) => ts.isFunctionLike(ancestor) || ts.isSourceFile(ancestor),
    );
}

/** Reads the written name of an object member; computed names give `null`. */
export function propertyName(member) {
    const name = member.name;
    if (!name) return null;
    if (ts.isIdentifier(name) || ts.isStringLiteral(name) || ts.isNumericLiteral(name)) {
        return name.text;
    }

    return null;
}

/** Finds a property of an object literal by its written name. */
export function objectProperty(object, name) {
    return object.properties.find(
        (member) =>
            (ts.isPropertyAssignment(member) || ts.isShorthandPropertyAssignment(member)) &&
            propertyName(member) === name,
    );
}
