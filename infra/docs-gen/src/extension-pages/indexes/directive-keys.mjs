import ts from 'typescript';

const DIRECTIVE_INTERFACE = 'DirectiveSyntaxAdditionalSupportedExtensions';

/** Records keys that a file adds to `DirectiveSyntaxAdditionalSupportedExtensions`. */
export function collectDirectiveKey(node, {index, file}) {
    if (!ts.isInterfaceDeclaration(node) || node.name.text !== DIRECTIVE_INTERFACE) return;

    const keys = node.members
        .filter(ts.isPropertySignature)
        .map((member) => member.name.getText(file));
    if (keys.length === 0) return;

    index.directiveKeys.set(file.fileName, [
        ...(index.directiveKeys.get(file.fileName) ?? []),
        ...keys,
    ]);
}
