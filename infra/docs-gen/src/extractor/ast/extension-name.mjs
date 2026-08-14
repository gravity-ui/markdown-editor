import ts from 'typescript';

import {forEachNode, hasExportModifier, parseSource, unique, unwrapExpression} from './core.mjs';

const EXTENSION_TYPE_NAMES = new Set(['Extension', 'ExtensionAuto', 'ExtensionWithOptions']);

function getTypeReferenceName(typeName) {
    if (ts.isIdentifier(typeName)) return typeName.text;
    if (ts.isQualifiedName(typeName)) return typeName.right.text;

    return null;
}

function isExtensionType(typeNode) {
    return (
        typeNode &&
        ts.isTypeReferenceNode(typeNode) &&
        EXTENSION_TYPE_NAMES.has(getTypeReferenceName(typeNode.typeName))
    );
}

function isObjectAssignFromKnownExtension(initializer, extensionImplementations) {
    if (!initializer) return false;

    const current = unwrapExpression(initializer);
    if (!ts.isCallExpression(current) || !ts.isPropertyAccessExpression(current.expression)) {
        return false;
    }

    const callee = current.expression;
    if (
        !ts.isIdentifier(callee.expression) ||
        callee.expression.text !== 'Object' ||
        callee.name.text !== 'assign'
    ) {
        return false;
    }

    const firstArg = current.arguments[0];
    return (
        Boolean(firstArg) &&
        ts.isIdentifier(firstArg) &&
        extensionImplementations.has(firstArg.text)
    );
}

function readVariableDeclarations(sourceFile) {
    const declarations = [];

    forEachNode(sourceFile, (node) => {
        if (!ts.isVariableStatement(node)) return;

        for (const declaration of node.declarationList.declarations) {
            if (ts.isIdentifier(declaration.name)) {
                declarations.push({statement: node, declaration});
            }
        }
    });

    return declarations;
}

export function extractExtensionNamesFromSource(content, fileName) {
    const sourceFile = parseSource(content, fileName);
    const declarations = readVariableDeclarations(sourceFile);
    const extensionImplementations = new Set(
        declarations
            .filter(({declaration}) => isExtensionType(declaration.type))
            .map(({declaration}) => declaration.name.text),
    );
    const names = [];

    for (const {statement, declaration} of declarations) {
        if (!hasExportModifier(statement)) continue;

        if (
            isExtensionType(declaration.type) ||
            isObjectAssignFromKnownExtension(declaration.initializer, extensionImplementations)
        ) {
            names.push(declaration.name.text);
        }
    }

    return unique(names);
}
