import type {Node} from 'prosemirror-model';
import type {} from '../extensions/behavior/Placeholder';

export const getPlaceholderContent = (node: Node, parent?: Node | null) => {
    const content = node.type.spec.placeholder?.content || '';

    return typeof content === 'function' ? content(node, parent) : content;
};
