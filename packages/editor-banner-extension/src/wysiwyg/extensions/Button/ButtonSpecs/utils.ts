import type {Node} from '@gravity-ui/markdown-editor/pm/model';
import {pType} from '@gravity-ui/markdown-editor/specs';

import {ButtonNodeAttr, buttonNodeType} from './const';

export const isButton = (node: Node | null | undefined): boolean =>
    Boolean(node && node.type === buttonNodeType(node.type.schema));

export function buttonPlaceholder(node: Node): string {
    const placeholder = node.type.spec.placeholder?.content;
    return (typeof placeholder === 'function' ? placeholder(node) : placeholder) ?? '';
}

export const hasButtonLabel = (node: Node) => Boolean(node.attrs[ButtonNodeAttr.Label].trim());

export const buttonLabel = (node: Node): string =>
    node.attrs[ButtonNodeAttr.Label].trim() || buttonPlaceholder(node);

/** A paragraph of buttons and spaces. */
export function isButtonRow(node: Node): boolean {
    if (node.type !== pType(node.type.schema)) return false;
    let buttons = 0;
    for (let index = 0; index < node.childCount; index++) {
        const child = node.child(index);
        if (isButton(child)) buttons++;
        else if (!child.isText || child.text?.trim()) return false;
    }
    return buttons > 0;
}
