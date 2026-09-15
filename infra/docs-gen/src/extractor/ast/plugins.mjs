/**
 * English: AST scanner for ProseMirror plugin registrations.
 *
 * Русский: AST-сканер регистраций ProseMirror plugins.
 */
import ts from 'typescript';

import {isBuilderMethodCall} from './builder.mjs';
import {forEachNode, parseSource, unique} from './core.mjs';
import {describeFactoryExpression} from './factory.mjs';

/**
 * Extracts ProseMirror plugin factory names.
 */
export function extractPlugins(content) {
    const sourceFile = parseSource(content);
    const plugins = [];

    forEachNode(sourceFile, (node) => {
        if (!ts.isCallExpression(node) || !isBuilderMethodCall(node, new Set(['addPlugin']))) {
            return;
        }

        const firstArg = node.arguments[0];
        const pluginName = firstArg ? describeFactoryExpression(firstArg, sourceFile) : null;
        if (pluginName) plugins.push(pluginName);
    });

    return unique(plugins);
}
