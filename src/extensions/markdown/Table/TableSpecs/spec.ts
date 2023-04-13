import type {NodeSpec} from 'prosemirror-model';
import {TableRole} from '../../../../table-utils';
import {CellAlign, TableAttrs, TableNode} from '../const';

export const spec: Record<TableNode, NodeSpec> = {
    [TableNode.Table]: {
        group: 'block',
        content: `${TableNode.Head} ${TableNode.Body}`,
        isolating: true,
        parseDOM: [{tag: 'table'}],
        toDOM() {
            return ['table', 0];
        },
        selectable: true,
        allowSelection: true,
        tableRole: TableRole.Table,
        complex: 'root',
    },

    [TableNode.Head]: {
        group: 'block',
        content: TableNode.Row,
        isolating: true,
        parseDOM: [{tag: 'thead'}],
        toDOM() {
            return ['thead', 0];
        },
        tableRole: TableRole.Body,
        selectable: false,
        allowSelection: false,
        complex: 'inner',
    },

    [TableNode.Body]: {
        group: 'block',
        content: `${TableNode.Row}+`,
        isolating: true,
        parseDOM: [{tag: 'tbody'}],
        toDOM() {
            return ['tbody', 0];
        },
        tableRole: TableRole.Body,
        selectable: false,
        allowSelection: false,
        complex: 'inner',
    },

    [TableNode.Row]: {
        group: 'block',
        content: `(${TableNode.HeaderCell}|${TableNode.DataCell})+`,
        isolating: true,
        parseDOM: [{tag: 'tr'}],
        toDOM() {
            return ['tr', 0];
        },
        tableRole: TableRole.Row,
        selectable: false,
        allowSelection: false,
        complex: 'inner',
    },

    [TableNode.HeaderCell]: cellTemplate('th'),

    [TableNode.DataCell]: cellTemplate('td'),
};

function cellTemplate(tag: 'th' | 'td'): NodeSpec {
    return {
        attrs: {[TableAttrs.CellAlign]: {default: CellAlign.Left}},
        group: 'block',
        content: '(text | inline)*',
        isolating: true,
        parseDOM: [
            {
                tag,
                getAttrs(dom) {
                    if (!(dom as Element).hasAttribute(TableAttrs.CellAlign)) return null;
                    return {
                        [TableAttrs.CellAlign]: (dom as Element).getAttribute(TableAttrs.CellAlign),
                    };
                },
            },
        ],
        toDOM({attrs}) {
            return [
                tag,
                {
                    ...attrs,
                    style: `text-align:${attrs[TableAttrs.CellAlign]}`,
                },
                0,
            ];
        },
        tableRole: TableRole.Cell,
        selectable: false,
        allowSelection: false,
        complex: 'leaf',
    };
}
