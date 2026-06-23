import ts from 'typescript';

import {EXTENSION_BUILDER_TYPE_NAMES, EXTENSION_TYPE_NAMES} from './extension-config.mjs';

function getTypeReferenceName(typeName) {
    if (ts.isIdentifier(typeName)) return typeName.text;
    if (ts.isQualifiedName(typeName)) return typeName.right.text;

    return null;
}

function isTypeReferenceTo(typeNode, names) {
    return (
        typeNode &&
        ts.isTypeReferenceNode(typeNode) &&
        names.has(getTypeReferenceName(typeNode.typeName))
    );
}

function unwrapExpression(expression) {
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

function hasExportModifier(node) {
    return ts.getModifiers(node)?.some((modifier) => modifier.kind === ts.SyntaxKind.ExportKeyword);
}

function readVariableDeclarations(sourceFile) {
    return sourceFile.statements.flatMap((statement) => {
        if (!ts.isVariableStatement(statement)) return [];

        return statement.declarationList.declarations
            .filter((declaration) => ts.isIdentifier(declaration.name))
            .map((declaration) => ({statement, declaration}));
    });
}

function isExtensionInitializer(initializer) {
    const current = initializer && unwrapExpression(initializer);

    return (
        current &&
        ts.isArrowFunction(current) &&
        isTypeReferenceTo(current.parameters[0]?.type, EXTENSION_BUILDER_TYPE_NAMES)
    );
}

function isObjectAssignFromKnownExtension(initializer, extensionImplementations) {
    const current = initializer && unwrapExpression(initializer);
    if (
        !current ||
        !ts.isCallExpression(current) ||
        !ts.isPropertyAccessExpression(current.expression)
    ) {
        return false;
    }

    const callee = current.expression;
    const firstArg = current.arguments[0];

    return (
        ts.isIdentifier(callee.expression) &&
        callee.expression.text === 'Object' &&
        callee.name.text === 'assign' &&
        firstArg &&
        ts.isIdentifier(firstArg) &&
        extensionImplementations.has(firstArg.text)
    );
}

export function sourceHasExtensionExport(content) {
    const sourceFile = ts.createSourceFile('source.tsx', content, ts.ScriptTarget.Latest, true);
    const declarations = readVariableDeclarations(sourceFile);
    const extensionImplementations = new Set(
        declarations
            .filter(({declaration}) => isTypeReferenceTo(declaration.type, EXTENSION_TYPE_NAMES))
            .map(({declaration}) => declaration.name.text),
    );

    return declarations.some(({statement, declaration}) => {
        if (!hasExportModifier(statement)) return false;

        return (
            isTypeReferenceTo(declaration.type, EXTENSION_TYPE_NAMES) ||
            isExtensionInitializer(declaration.initializer) ||
            isObjectAssignFromKnownExtension(declaration.initializer, extensionImplementations)
        );
    });
}
