/* eslint-disable jsdoc/require-param, jsdoc/require-returns */
import ts from 'typescript';

import {EXTENSION_TYPE_NAMES} from './extension-config.mjs';

/** Reads the visible name from a TypeScript type reference. */
function getTypeReferenceName(typeName) {
    if (ts.isIdentifier(typeName)) return typeName.text;
    if (ts.isQualifiedName(typeName)) return typeName.right.text;

    return null;
}

/** Checks that a type annotation references one of the configured names. */
function isTypeReferenceTo(typeNode, names) {
    return (
        typeNode &&
        ts.isTypeReferenceNode(typeNode) &&
        names.has(getTypeReferenceName(typeNode.typeName))
    );
}

/** Detects direct `export` modifiers on a top-level declaration statement. */
function hasExportModifier(node) {
    return ts.getModifiers(node)?.some((modifier) => modifier.kind === ts.SyntaxKind.ExportKeyword);
}

/** Reads extension export names from a TypeScript source file. */
export function extractExtensionNamesFromSource(content, fileName = 'source.ts') {
    const sourceFile = ts.createSourceFile(fileName, content, ts.ScriptTarget.Latest, true);
    const names = [];

    for (const statement of sourceFile.statements) {
        if (!ts.isVariableStatement(statement) || !hasExportModifier(statement)) continue;

        for (const declaration of statement.declarationList.declarations) {
            if (
                ts.isIdentifier(declaration.name) &&
                isTypeReferenceTo(declaration.type, EXTENSION_TYPE_NAMES)
            ) {
                names.push(declaration.name.text);
            }
        }
    }

    return names;
}
