import ts from 'typescript';

import {callsOf} from '../extension-graph.mjs';
import {NOT_RECOGNIZED, inlineText, section} from '../markdown.mjs';
import {
    arrayElements,
    followVariable,
    resolveDeclaration,
    resolveLiteral,
    resolveString,
    returnedObjectLiterals,
} from '../symbols.mjs';
import {asFunction, objectProperty, returnedExpressions, unwrapExpression} from '../syntax.mjs';
import {MAX_DEPTH, sortedUnique} from '../utils.mjs';

const MARK_INPUT_RULE = 'markInputRule';

/** Lists the `rules` of a `builder.addInputRules` callback; an unreadable callback gives `null`. */
function ruleExpressions({checker}, call) {
    const fn = asFunction(call.arguments[0]);
    if (!fn) return null;

    const lists = returnedObjectLiterals(checker, fn)
        .map((object) => objectProperty(object, 'rules'))
        .filter(Boolean)
        .map((member) =>
            arrayElements(
                checker,
                ts.isShorthandPropertyAssignment(member) ? member.name : member.initializer,
            ),
        );
    if (lists.length === 0 || lists.includes(null)) return null;

    return lists.flat().map((rule) => followVariable(checker, rule));
}

/** Reads the source text of a regular expression argument: a literal, `new RegExp(…)` or a variable with one of them. */
function regExpText(index, argument) {
    const literal = resolveLiteral(index, argument);
    if (literal && ts.isRegularExpressionLiteral(literal)) return literal.getText();

    const value = followVariable(index.checker, argument);
    const isRegExp =
        value &&
        (ts.isRegularExpressionLiteral(value) ||
            (ts.isNewExpression(value) &&
                ts.isIdentifier(value.expression) &&
                value.expression.text === 'RegExp'));

    return isRegExp ? inlineText(value.getText()) : null;
}

/** Returns the function a call runs when the function is declared in the project. */
function projectFunction(index, call) {
    const declaration = resolveDeclaration(index.checker, call.expression);
    if (!declaration || !index.files.has(declaration.getSourceFile().fileName)) return null;
    if (ts.isFunctionDeclaration(declaration)) return declaration;

    return ts.isVariableDeclaration(declaration) ? asFunction(declaration.initializer) : null;
}

/**
 * Reads the pattern of a rule: the first argument of `markInputRule` as written,
 * or the regular expression passed to the rule or to the rule of a project function it returns.
 */
function rulePattern(index, rule, depth = 0) {
    const node = followVariable(index.checker, rule);
    if (!node || depth > MAX_DEPTH || (!ts.isCallExpression(node) && !ts.isNewExpression(node))) {
        return null;
    }
    const args = node.arguments ?? [];
    if (ts.isIdentifier(node.expression) && node.expression.text === MARK_INPUT_RULE && args[0]) {
        return inlineText(args[0].getText());
    }

    const pattern = args.map((argument) => regExpText(index, argument)).find(Boolean);
    if (pattern) return pattern;

    const fn = ts.isCallExpression(node) ? projectFunction(index, node) : null;
    const returned = fn ? returnedExpressions(fn) : [];

    return (
        returned.map((expression) => rulePattern(index, expression, depth + 1)).find(Boolean) ??
        null
    );
}

/** Finds the name argument of the type factory a declaration holds, through constants. */
function typeFactoryArgument(index, declaration) {
    let current = declaration;
    for (let depth = 0; current && depth < MAX_DEPTH; depth++) {
        const factoryArgument = index.typeFactories.get(current);
        if (factoryArgument) return factoryArgument;

        const initializer = unwrapExpression(index.constants.get(current));
        current = initializer && resolveDeclaration(index.checker, initializer);
    }

    return null;
}

/** Reads the type name from the first call of a `nodeTypeFactory` or `markTypeFactory` result. */
function ruleTypeName(index, rule) {
    let name = null;
    const visit = (node) => {
        if (name) return;
        if (ts.isCallExpression(node)) {
            const declaration = resolveDeclaration(index.checker, node.expression);
            const factoryArgument = declaration && typeFactoryArgument(index, declaration);
            if (factoryArgument) name = resolveString(index, factoryArgument);
        }
        ts.forEachChild(node, visit);
    };
    visit(rule);

    return name;
}

/** Renders one rule as its pattern and the type it creates. */
function ruleItem(index, rule) {
    const pattern = rulePattern(index, rule);
    if (!pattern) return `- ${NOT_RECOGNIZED}`;

    const type = ruleTypeName(index, rule);
    return `- \`${pattern}\` → ${type ? `\`${type}\`` : NOT_RECOGNIZED}`;
}

/** Renders input rules with their patterns and the types they create. */
export function inputRulesSection({index, calls}) {
    const ruleCalls = callsOf(calls, 'addInputRules');
    const rules = ruleCalls.map((call) => ruleExpressions(index, call));
    const items = sortedUnique(
        rules.flatMap((list) => (list ? list.map((rule) => ruleItem(index, rule)) : [])),
    );
    const unreadable = items.length > 0 && rules.includes(null) ? [`- ${NOT_RECOGNIZED}`] : [];

    return section('### Input rules', [...items, ...unreadable], ruleCalls.length > 0);
}
