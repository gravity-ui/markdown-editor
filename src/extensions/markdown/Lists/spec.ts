import {NodeSpec} from 'prosemirror-model';
import {ListNode} from './const';

export const spec: Record<ListNode, NodeSpec> = {
    [ListNode.ListItem]: {
        attrs: {tight: {default: false}},
        content: '(paragraph|block)+',
        defining: true,
        parseDOM: [{tag: 'li'}],
        toDOM() {
            return ['li', 0];
        },
        selectable: false,
        allowSelection: false,
        disableGapCursor: true,
        complex: 'leaf',
    },

    [ListNode.BulletList]: {
        content: `${ListNode.ListItem}+`,
        group: 'block',
        parseDOM: [{tag: 'ul'}],
        toDOM() {
            return ['ul', 0];
        },
        selectable: false,
        allowSelection: false,
        complex: 'root',
    },

    [ListNode.OrderedList]: {
        attrs: {order: {default: 1}, tight: {default: false}},
        content: `${ListNode.ListItem}+`,
        group: 'block',
        parseDOM: [
            {
                tag: 'ol',
                getAttrs(dom) {
                    return {
                        order: (dom as Element).hasAttribute('start')
                            ? Number((dom as Element).getAttribute('start'))
                            : 1,
                    };
                },
            },
        ],
        toDOM(node) {
            return node.attrs.order === 1 ? ['ol', 0] : ['ol', {start: node.attrs.order}, 0];
        },
        selectable: false,
        allowSelection: false,
        complex: 'root',
    },
};
