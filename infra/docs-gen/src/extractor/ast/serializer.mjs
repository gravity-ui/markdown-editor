/**
 * English: AST scanner for serializer markdown output hints.
 *
 * Русский: AST-сканер markdown-подсказок из serializer output.
 */
import ts from 'typescript';

import {forEachNode, getStringValue, parseSource, unique, unwrapExpression} from './core.mjs';

/**
 * Extracts serializer output snippets.
 */
export function extractSerializerSyntax(content) {
    const sourceFile = parseSource(content);
    const snippets = [];

    forEachNode(sourceFile, (node) => {
        if (!ts.isCallExpression(node)) return;

        const expression = unwrapExpression(node.expression);
        if (!ts.isPropertyAccessExpression(expression)) return;
        if (!ts.isIdentifier(expression.expression) || expression.expression.text !== 'state')
            return;
        if (expression.name.text !== 'write' && expression.name.text !== 'text') return;

        const snippet = node.arguments[0] ? getStringValue(node.arguments[0]) : null;
        if (snippet?.trim()) snippets.push(snippet);
    });

    return unique(snippets);
}
