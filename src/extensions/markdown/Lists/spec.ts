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
        attrs: {tight: {default: false}},
        parseDOM: [
            {
                tag: 'ul',
                getAttrs: (dom) => ({tight: (dom as HTMLElement).hasAttribute('data-tight')}),
            },
        ],
        toDOM(node) {
            return ['ul', {'data-tight': node.attrs.tight ? 'true' : null}, 0];
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
                        order: (dom as HTMLElement).hasAttribute('start')
                            ? Number((dom as HTMLElement).getAttribute('start')!)
                            : 1,
                        tight: (dom as HTMLElement).hasAttribute('data-tight'),
                    };
                },
            },
        ],
        toDOM(node) {
            return [
                'ol',
                {
                    start: node.attrs.order === 1 ? null : node.attrs.order,
                    'data-tight': node.attrs.tight ? 'true' : null,
                },
                0,
            ];
        },
        selectable: false,
        allowSelection: false,
        complex: 'root',
    },
};
