import ts from 'typescript';

const VALUE_TYPE = 'DirectiveSyntaxValue';
const DEFAULT_CONSTANT = 'DIRECTIVE_SYNTAX_DEFAULT';

/** Records the text of the `DirectiveSyntaxValue` type and of the `DIRECTIVE_SYNTAX_DEFAULT` value. */
export function collectDirectiveSyntax(node, {index, file}) {
    if (ts.isTypeAliasDeclaration(node) && node.name.text === VALUE_TYPE) {
        index.directiveSyntax.set('values', node.type.getText(file));
    }
    if (
        ts.isVariableDeclaration(node) &&
        ts.isIdentifier(node.name) &&
        node.name.text === DEFAULT_CONSTANT &&
        node.initializer
    ) {
        index.directiveSyntax.set('default', node.initializer.getText(file));
    }
}
