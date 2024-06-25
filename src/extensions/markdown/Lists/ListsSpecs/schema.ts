import type {NodeSpec} from 'prosemirror-model';

import {ListNode, ListsAttr} from './const';

export const schemaSpecs: Record<ListNode, NodeSpec> = {
    [ListNode.ListItem]: {
        attrs: {[ListsAttr.Tight]: {default: false}, [ListsAttr.Markup]: {default: null}},
        content: '(paragraph|block)+',
        defining: true,
        parseDOM: [{tag: 'li'}],
        toDOM() {
            return ['li', 0];
        },
        selectable: true,
        allowSelection: false,
        disableGapCursor: true,
        complex: 'leaf',
    },

    [ListNode.BulletList]: {
        content: `${ListNode.ListItem}+`,
        group: 'block',
        attrs: {[ListsAttr.Tight]: {default: false}, [ListsAttr.Bullet]: {default: '*'}},
        parseDOM: [
            {
                tag: 'ul',
                getAttrs: (dom) => ({
                    [ListsAttr.Tight]: (dom as HTMLElement).hasAttribute('data-tight'),
                }),
            },
        ],
        toDOM(node) {
            return ['ul', {'data-tight': node.attrs[ListsAttr.Tight] ? 'true' : null}, 0];
        },
        selectable: false,
        allowSelection: false,
        complex: 'root',
    },

    [ListNode.OrderedList]: {
        attrs: {[ListsAttr.Order]: {default: 1}, [ListsAttr.Tight]: {default: false}},
        content: `${ListNode.ListItem}+`,
        group: 'block',
        parseDOM: [
            {
                tag: 'ol',
                getAttrs(dom) {
                    return {
                        [ListsAttr.Order]: (dom as HTMLElement).hasAttribute('start')
                            ? Number((dom as HTMLElement).getAttribute('start')!)
                            : 1,
                        [ListsAttr.Tight]: (dom as HTMLElement).hasAttribute('data-tight'),
                    };
                },
            },
        ],
        toDOM(node) {
            return [
                'ol',
                {
                    start: node.attrs[ListsAttr.Order] === 1 ? null : node.attrs[ListsAttr.Order],
                    'data-tight': node.attrs[ListsAttr.Tight] ? 'true' : null,
                },
                0,
            ];
        },
        selectable: false,
        allowSelection: false,
        complex: 'root',
    },
};
