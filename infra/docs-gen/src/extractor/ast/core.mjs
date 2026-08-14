import ts from 'typescript';

export function parseSource(content, fileName = 'source.tsx') {
    return ts.createSourceFile(fileName, content, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
}

export function forEachNode(root, callback) {
    const visit = (node) => {
        callback(node);
        ts.forEachChild(node, visit);
    };

    visit(root);
}

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

export function hasExportModifier(node) {
    return ts.getModifiers(node)?.some((modifier) => modifier.kind === ts.SyntaxKind.ExportKeyword);
}

export function unique(values) {
    return [...new Set(values.filter(Boolean))];
}
