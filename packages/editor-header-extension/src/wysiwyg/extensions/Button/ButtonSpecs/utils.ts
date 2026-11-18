import type {Node} from '@gravity-ui/markdown-editor/pm/model';

import {ButtonNodeAttr} from './const';

/** The label of the button, or the placeholder when the label is blank. */
export function buttonLabel(node: Node): string {
    const label = node.attrs[ButtonNodeAttr.Label].trim();
    if (label) return label;
    const placeholder = node.type.spec.placeholder?.content;
    return (typeof placeholder === 'function' ? placeholder(node) : placeholder) ?? '';
}
