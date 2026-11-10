/* eslint-disable jsdoc/require-param, jsdoc/require-returns */
import ts from 'typescript';

/** Type annotations an extension entry point uses for its extension constant. */
const EXTENSION_TYPE_NAMES = new Set(['Extension', 'ExtensionAuto', 'ExtensionWithOptions']);

/** Reads the visible name from a TypeScript type reference. */
function getTypeReferenceName(typeName) {
    if (ts.isIdentifier(typeName)) return typeName.text;
    if (ts.isQualifiedName(typeName)) return typeName.right.text;

    return null;
}

/** Checks that a type annotation references one of the extension types. */
function isExtensionType(typeNode) {
    return (
        typeNode &&
        ts.isTypeReferenceNode(typeNode) &&
        EXTENSION_TYPE_NAMES.has(getTypeReferenceName(typeNode.typeName))
    );
}

/** Detects a direct `export` modifier on a top-level declaration statement. */
function hasExportModifier(node) {
    return ts.getModifiers(node)?.some((modifier) => modifier.kind === ts.SyntaxKind.ExportKeyword);
}

/** Reads names of exported extension constants from TypeScript source text. */
export function extractExtensionNamesFromSource(content, fileName = 'source.ts') {
    const sourceFile = ts.createSourceFile(fileName, content, ts.ScriptTarget.Latest, true);
    const names = [];

    for (const statement of sourceFile.statements) {
        if (!ts.isVariableStatement(statement) || !hasExportModifier(statement)) continue;

        for (const declaration of statement.declarationList.declarations) {
            if (ts.isIdentifier(declaration.name) && isExtensionType(declaration.type)) {
                names.push(declaration.name.text);
            }
        }
    }

    return names;
}
