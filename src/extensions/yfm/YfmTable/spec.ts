import type {NodeSpec} from 'prosemirror-model';
import {TableRole} from '../../../table-utils';
import {YfmTableNode} from './const';

const DEFAULT_CELL_PLACEHOLDER = 'Table cell';

export type YfmTableSpecOptions = {
    yfmTableCellPlaceholder?: NonNullable<NodeSpec['placeholder']>['content'];
};

export const getSpec = (opts?: YfmTableSpecOptions): Record<YfmTableNode, NodeSpec> => ({
    [YfmTableNode.Table]: {
        group: 'block yfm-table',
        content: `${YfmTableNode.Body}`,
        isolating: true,
        definingAsContext: true,
        parseDOM: [{tag: 'table', priority: 200}],
        toDOM() {
            return ['table', 0];
        },
        selectable: true,
        allowSelection: true,
        allowGapCursor: true,
        tableRole: TableRole.Table,
        complex: 'root',
    },

    [YfmTableNode.Body]: {
        group: 'block yfm-table',
        content: `${YfmTableNode.Row}+`,
        isolating: true,
        definingAsContext: true,
        parseDOM: [
            {tag: 'tbody', priority: 200},
            {tag: 'thead', priority: 200},
        ],
        toDOM() {
            return ['tbody', 0];
        },
        tableRole: TableRole.Body,
        selectable: false,
        allowSelection: false,
        complex: 'inner',
    },

    [YfmTableNode.Row]: {
        group: 'block yfm-table',
        content: `${YfmTableNode.Cell}+`,
        isolating: true,
        definingAsContext: true,
        parseDOM: [{tag: 'tr', priority: 200}],
        toDOM() {
            return ['tr', 0];
        },
        allowGapCursor: false,
        tableRole: TableRole.Row,
        selectable: false,
        allowSelection: false,
        complex: 'inner',
    },

    [YfmTableNode.Cell]: {
        group: 'block yfm-table',
        content: 'block+',
        isolating: true,
        definingAsContext: true,
        parseDOM: [
            {tag: 'td', priority: 200},
            {tag: 'th', priority: 200},
        ],
        toDOM() {
            return ['td', 0];
        },
        placeholder: {
            content: opts?.yfmTableCellPlaceholder ?? DEFAULT_CELL_PLACEHOLDER,
            alwaysVisible: true,
        },
        tableRole: TableRole.Cell,
        selectable: false,
        allowSelection: false,
        complex: 'leaf',
    },
});
