import type {Node} from '@gravity-ui/markdown-editor/pm/model';

/** The label of the button, or the placeholder when the label is blank. */
export function buttonLabel(node: Node): string {
    if (node.textContent.trim()) return node.textContent;
    const placeholder = node.type.spec.placeholder?.content;
    return (typeof placeholder === 'function' ? placeholder(node) : placeholder) ?? '';
}
