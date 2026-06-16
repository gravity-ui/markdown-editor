/**
 * English: AST scanner for markdown input-rule syntax hints.
 *
 * Русский: AST-сканер markdown input-rule подсказок синтаксиса.
 */
import ts from 'typescript';

import {
    forEachNode,
    getStaticPropertyName,
    getStringValue,
    parseSource,
    unique,
    unwrapExpression,
} from './core.mjs';

const INPUT_RULE_FACTORIES = new Set([
    'inlineNodeInputRule',
    'markInputRule',
    'nodeInputRule',
    'textblockTypeInputRule',
    'wrappingInputRule',
]);

/**
 * Extracts one input-rule syntax descriptor from a factory call.
 */
function describeInputRuleCall(callExpression) {
    const firstArg = callExpression.arguments[0];
    if (!firstArg) return null;

    const current = unwrapExpression(firstArg);
    if (ts.isObjectLiteralExpression(current)) {
        let open = null;
        let close = null;

        for (const property of current.properties) {
            if (!ts.isPropertyAssignment(property)) continue;

            const key = getStaticPropertyName(property.name);
            if (key === 'open') open = getStringValue(property.initializer);
            if (key === 'close') close = getStringValue(property.initializer);
        }

        return open !== null && close !== null ? `${open}...${close}` : null;
    }

    return null;
}

/**
 * Extracts input-rule syntax patterns.
 */
export function extractInputRules(content) {
    const sourceFile = parseSource(content);
    const rules = [];

    forEachNode(sourceFile, (node) => {
        if (!ts.isCallExpression(node)) return;

        const expression = unwrapExpression(node.expression);
        if (!ts.isIdentifier(expression) || !INPUT_RULE_FACTORIES.has(expression.text)) return;

        const rule = describeInputRuleCall(node);
        if (rule) rules.push(rule);
    });

    return unique(rules);
}
