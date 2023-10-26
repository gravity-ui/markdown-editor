import type {Node, NodeSpec} from 'prosemirror-model';

export type PlaceholderOptions = Record<string, NonNullable<NodeSpec['placeholder']>['content']>;

export const getPlaceholderContent = (node: Node, parent?: Node | null) => {
    const content = node.type.spec.placeholder?.content || '';

    return typeof content === 'function' ? content(node, parent) : content;
};
