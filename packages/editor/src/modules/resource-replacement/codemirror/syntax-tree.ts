import type {SyntaxNode} from '@lezer/common';

const codeNodes = new Set(['FencedCode', 'CodeBlock', 'InlineCode', 'Monospace']);

/** Ветки, исключаемые при чтении ресурсов и определений ссылок. */
export function isCodeSyntaxNode(node: SyntaxNode) {
    return codeNodes.has(node.name);
}
