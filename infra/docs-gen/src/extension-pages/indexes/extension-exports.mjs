import ts from 'typescript';

const EXTENSION_TYPE_NAMES = new Set(['Extension', 'ExtensionAuto', 'ExtensionWithOptions']);

/** Reads the written name of a type reference. */
function typeReferenceName(typeName) {
    if (ts.isIdentifier(typeName)) return typeName.text;
    if (ts.isQualifiedName(typeName)) return typeName.right.text;

    return null;
}

/** Checks that a type annotation references one of the extension types. */
function isExtensionType(typeNode) {
    return Boolean(
        typeNode &&
        ts.isTypeReferenceNode(typeNode) &&
        EXTENSION_TYPE_NAMES.has(typeReferenceName(typeNode.typeName)),
    );
}

/** Detects a direct `export` modifier on a statement. */
function hasExportModifier(node) {
    return Boolean(
        ts.getModifiers(node)?.some((modifier) => modifier.kind === ts.SyntaxKind.ExportKeyword),
    );
}

/** Records names of exported constants annotated with an extension type. */
export function collectExtensionExport(node, {index, file}) {
    if (!ts.isVariableStatement(node) || node.parent !== file || !hasExportModifier(node)) return;

    const names = node.declarationList.declarations
        .filter((declaration) => ts.isIdentifier(declaration.name))
        .filter((declaration) => isExtensionType(declaration.type))
        .map((declaration) => declaration.name.text);
    if (names.length === 0) return;

    index.extensionExports.set(file.fileName, [
        ...(index.extensionExports.get(file.fileName) ?? []),
        ...names,
    ]);
}
