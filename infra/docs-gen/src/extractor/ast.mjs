import ts from 'typescript';

const BUILDER_ROOT_NAME = 'builder';

const BUILDER_CHAIN_METHODS = new Set([
    'addAction',
    'addKeymap',
    'addMark',
    'addMarkSpec',
    'addMarkdownTokenParserSpec',
    'addNode',
    'addNodeSerializerSpec',
    'addNodeSpec',
    'addPlugin',
    'configureMd',
]);

const INPUT_RULE_FACTORIES = new Set([
    'inlineNodeInputRule',
    'markInputRule',
    'nodeInputRule',
    'textblockTypeInputRule',
    'wrappingInputRule',
]);

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
 * Checks whether an expression is the root builder or a builder call chain.
 */
function isBuilderExpression(expression) {
    const current = unwrapExpression(expression);

    if (ts.isIdentifier(current)) return current.text === BUILDER_ROOT_NAME;

    if (!ts.isCallExpression(current)) return false;
    if (!ts.isPropertyAccessExpression(current.expression)) return false;
    if (!BUILDER_CHAIN_METHODS.has(current.expression.name.text)) return false;

    return isBuilderExpression(current.expression.expression);
}

/**
 * Returns the called property name for a call expression.
 */
function getCallPropertyName(callExpression) {
    const expression = unwrapExpression(callExpression.expression);
    return ts.isPropertyAccessExpression(expression) ? expression.name.text : null;
}

/**
 * Checks whether a call is made on the extension builder chain.
 */
function isBuilderMethodCall(callExpression, methodNames) {
    const expression = unwrapExpression(callExpression.expression);

    return (
        ts.isPropertyAccessExpression(expression) &&
        methodNames.has(expression.name.text) &&
        isBuilderExpression(expression.expression)
    );
}

/**
 * Extracts first arguments from extension builder method calls.
 */
function extractBuilderCallFirstArgs(content, methodNames) {
    const sourceFile = parseSource(content);
    const names = [];

    forEachNode(sourceFile, (node) => {
        if (!ts.isCallExpression(node) || !isBuilderMethodCall(node, methodNames)) return;

        const firstArg = node.arguments[0];
        const name = firstArg ? getExpressionName(firstArg, sourceFile) : null;
        if (name) names.push(name);
    });

    return unique(names);
}

/**
 * Extracts ProseMirror node registrations from builder calls.
 */
export function extractAddNode(content) {
    return extractBuilderCallFirstArgs(content, new Set(['addNode']));
}

/**
 * Extracts ProseMirror mark registrations from builder calls.
 */
export function extractAddMark(content) {
    return extractBuilderCallFirstArgs(content, new Set(['addMark']));
}

/**
 * Extracts node names from granular node spec registrations.
 */
export function extractNodeSpecs(content) {
    return extractBuilderCallFirstArgs(content, new Set(['addNodeSpec']));
}

/**
 * Extracts mark names from granular mark spec registrations.
 */
export function extractMarkSpecs(content) {
    return extractBuilderCallFirstArgs(content, new Set(['addMarkSpec']));
}

/**
 * Extracts editor action identifiers from builder calls.
 */
export function extractActions(content) {
    return extractBuilderCallFirstArgs(content, new Set(['addAction']));
}

/**
 * Reads a returned expression from a function-like callback.
 */
function getStaticReturnExpression(callback) {
    const body = callback.body;
    if (!ts.isBlock(body)) return unwrapExpression(body);

    for (const statement of body.statements) {
        if (ts.isReturnStatement(statement)) return statement.expression || null;
    }

    return null;
}

/**
 * Describes a factory callback or plugin expression with a stable identifier.
 */
function describeFactoryExpression(expression, sourceFile) {
    const current = unwrapExpression(expression);

    if (ts.isIdentifier(current) || ts.isPropertyAccessExpression(current)) {
        return getExpressionName(current, sourceFile);
    }

    if (ts.isCallExpression(current)) {
        return getExpressionName(current.expression, sourceFile);
    }

    if (ts.isNewExpression(current)) {
        return getExpressionName(current.expression, sourceFile);
    }

    if (ts.isArrowFunction(current) || ts.isFunctionExpression(current)) {
        const returned = getStaticReturnExpression(current);
        return returned ? describeFactoryExpression(returned, sourceFile) : null;
    }

    return null;
}

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

/**
 * Extracts static keys from an object literal.
 */
function extractObjectLiteralKeys(objectLiteral, knownObjects = new Map()) {
    const keys = [];

    for (const property of objectLiteral.properties) {
        if (ts.isSpreadAssignment(property)) {
            const spreadName = ts.isIdentifier(property.expression)
                ? property.expression.text
                : null;
            if (spreadName && knownObjects.has(spreadName)) {
                keys.push(...knownObjects.get(spreadName));
            }
            continue;
        }

        if (!ts.isPropertyAssignment(property) && !ts.isShorthandPropertyAssignment(property)) {
            continue;
        }

        const key = getStaticPropertyName(property.name);
        if (key) keys.push(key);
    }

    return keys;
}

/**
 * Reads object-literal keys from a return expression or local object reference.
 */
function extractKeymapExpressionKeys(expression, knownObjects = new Map()) {
    const current = unwrapExpression(expression);

    if (ts.isObjectLiteralExpression(current)) {
        return extractObjectLiteralKeys(current, knownObjects);
    }

    if (ts.isIdentifier(current) && knownObjects.has(current.text)) {
        return knownObjects.get(current.text);
    }

    return [];
}

/**
 * Registers one top-level object literal binding from a callback block.
 */
function collectObjectBinding(statement, knownObjects) {
    if (!ts.isVariableStatement(statement)) return;

    for (const declaration of statement.declarationList.declarations) {
        if (!ts.isIdentifier(declaration.name) || !declaration.initializer) continue;

        const initializer = unwrapExpression(declaration.initializer);
        if (ts.isObjectLiteralExpression(initializer)) {
            knownObjects.set(
                declaration.name.text,
                unique(extractObjectLiteralKeys(initializer, knownObjects)),
            );
        }
    }
}

/**
 * Registers a static key assignment into a known object binding.
 */
function collectObjectAssignment(statement, knownObjects) {
    if (!ts.isExpressionStatement(statement)) return;

    const expression = unwrapExpression(statement.expression);
    if (
        !ts.isBinaryExpression(expression) ||
        expression.operatorToken.kind !== ts.SyntaxKind.EqualsToken
    ) {
        return;
    }

    const left = unwrapExpression(expression.left);
    let objectName = null;
    let keyName = null;

    if (ts.isPropertyAccessExpression(left)) {
        objectName = ts.isIdentifier(left.expression) ? left.expression.text : null;
        keyName = left.name.text;
    } else if (ts.isElementAccessExpression(left)) {
        objectName = ts.isIdentifier(left.expression) ? left.expression.text : null;
        keyName = ts.isStringLiteralLike(left.argumentExpression)
            ? left.argumentExpression.text
            : null;
    }

    if (!objectName || !keyName || !knownObjects.has(objectName)) return;

    knownObjects.set(objectName, unique([...knownObjects.get(objectName), keyName]));
}

/**
 * Extracts static key bindings from an addKeymap callback.
 */
function extractKeymapCallbackKeys(callback) {
    const body = unwrapExpression(callback.body);
    if (!ts.isBlock(body)) return extractKeymapExpressionKeys(body);

    const knownObjects = new Map();
    for (const statement of body.statements) {
        collectObjectBinding(statement, knownObjects);
        collectObjectAssignment(statement, knownObjects);

        if (ts.isReturnStatement(statement) && statement.expression) {
            return extractKeymapExpressionKeys(statement.expression, knownObjects);
        }
    }

    return [];
}

/**
 * Extracts static key bindings from addKeymap callbacks.
 */
export function extractKeymaps(content) {
    const sourceFile = parseSource(content);
    const keymaps = [];

    forEachNode(sourceFile, (node) => {
        if (!ts.isCallExpression(node) || !isBuilderMethodCall(node, new Set(['addKeymap']))) {
            return;
        }

        const callback = unwrapExpression(node.arguments[0]);
        if (callback && (ts.isArrowFunction(callback) || ts.isFunctionExpression(callback))) {
            keymaps.push(...extractKeymapCallbackKeys(callback));
        }
    });

    return unique(keymaps);
}

/**
 * Extracts one input-rule syntax descriptor from a factory call.
 */
function describeInputRuleCall(callExpression) {
    const firstArg = callExpression.arguments[0];
    if (!firstArg) return null;

    const current = unwrapExpression(firstArg);
    if (current.kind === ts.SyntaxKind.RegularExpressionLiteral) {
        return current.getText(callExpression.getSourceFile());
    }

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
