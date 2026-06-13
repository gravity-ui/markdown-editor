/**
 * English: AST scanner for markdown-it plugin registrations inside configureMd callbacks.
 *
 * Русский: AST-сканер регистраций markdown-it plugins внутри callback-ов configureMd.
 */
import ts from 'typescript';

import {forEachNode, getCallPropertyName, parseSource, unique, unwrapExpression} from './core.mjs';
import {describeFactoryExpression} from './factory.mjs';

/**
 * Extracts markdown-it plugin registrations.
 */
export function extractMdPlugins(content) {
    const sourceFile = parseSource(content);
    const plugins = [];

    forEachNode(sourceFile, (node) => {
        if (!ts.isCallExpression(node) || getCallPropertyName(node) !== 'use') return;

        const expression = unwrapExpression(node.expression);
        if (!ts.isPropertyAccessExpression(expression) || !ts.isIdentifier(expression.expression))
            return;
        if (expression.expression.text !== 'md') return;

        const firstArg = node.arguments[0];
        const pluginName = firstArg ? describeFactoryExpression(firstArg, sourceFile) : null;
        if (pluginName) plugins.push(pluginName);
    });

    return unique(plugins);
}
