/**
 * English: Shared TypeScript AST primitives used by docs-gen source scanners.
 *
 * Русский: Общие примитивы TypeScript AST для сканеров исходников docs-gen.
 */
import ts from 'typescript';

/**
 * Parses TypeScript or TSX source into a traversable AST.
 */
export function parseSource(content, fileName = 'source.tsx') {
    return ts.createSourceFile(fileName, content, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
}

/**
 * Visits every AST node depth-first.
 */
export function forEachNode(root, callback) {
    const visit = (node) => {
        callback(node);
        ts.forEachChild(node, visit);
    };

    visit(root);
}

/**
 * Deduplicates values while preserving source order.
 */
export function unique(values) {
    return [...new Set(values.filter(Boolean))];
}

/**
 * Removes syntax wrappers that do not affect a static expression value.
 */
export function unwrapExpression(expression) {
    let current = expression;

    while (
        ts.isParenthesizedExpression(current) ||
        ts.isAsExpression(current) ||
        ts.isSatisfiesExpression(current) ||
        ts.isNonNullExpression(current) ||
        ts.isTypeAssertionExpression(current)
    ) {
        current = current.expression;
    }

    return current;
}

/**
 * Reads a static property name from an object-like AST node.
 */
export function getStaticPropertyName(name, {allowComputedLiteral = false} = {}) {
    if (ts.isIdentifier(name) || ts.isStringLiteral(name) || ts.isNumericLiteral(name)) {
        return name.text;
    }

    if (
        allowComputedLiteral &&
        ts.isComputedPropertyName(name) &&
        ts.isStringLiteralLike(unwrapExpression(name.expression))
    ) {
        return unwrapExpression(name.expression).text;
    }

    return null;
}

/**
 * Resolves syntax that names a constant, enum member, or string literal.
 */
export function getExpressionName(expression, sourceFile) {
    const current = unwrapExpression(expression);

    if (ts.isStringLiteralLike(current)) return current.text;
    if (ts.isIdentifier(current)) return current.text;

    if (ts.isPropertyAccessExpression(current)) {
        const baseName = getExpressionName(current.expression, sourceFile);
        return baseName ? `${baseName}.${current.name.text}` : current.getText(sourceFile).trim();
    }

    if (
        ts.isElementAccessExpression(current) &&
        ts.isStringLiteralLike(current.argumentExpression)
    ) {
        const baseName = getExpressionName(current.expression, sourceFile);
        return baseName ? `${baseName}.${current.argumentExpression.text}` : null;
    }

    return null;
}

/**
 * Resolves a literal string expression.
 */
export function getStringValue(expression) {
    const current = unwrapExpression(expression);
    return ts.isStringLiteralLike(current) ? current.text : null;
}

/**
 * Returns the called property name for a call expression.
 */
export function getCallPropertyName(callExpression) {
    const expression = unwrapExpression(callExpression.expression);
    return ts.isPropertyAccessExpression(expression) ? expression.name.text : null;
}
