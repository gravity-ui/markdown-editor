import type {Node} from '@gravity-ui/markdown-editor/pm/model';

/** The body of the button, or the placeholder when the body is blank. */
export function buttonLabel(node: Node): string {
    if (node.attrs.content.trim()) return node.attrs.content;
    const placeholder = node.type.spec.placeholder?.content;
    return (typeof placeholder === 'function' ? placeholder(node) : placeholder) ?? '';
}
