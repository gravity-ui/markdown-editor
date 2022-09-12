import type {NodeSpec} from 'prosemirror-model';
import {TableRole} from '../../../table-utils';
import {YfmTableNode} from './const';

const DEFAULT_CELL_PLACEHOLDER = 'Table cell';

export type YfmTableSpecOptions = {
    yfmTableCellPlaceholder?: NonNullable<NodeSpec['placeholder']>['content'];
};

export const getSpec = (opts?: YfmTableSpecOptions): Record<YfmTableNode, NodeSpec> => ({
    [YfmTableNode.Table]: {
        group: 'block',
        content: `${YfmTableNode.Body}`,
        isolating: true,
        parseDOM: [{tag: 'table'}],
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
        group: 'block',
        content: `${YfmTableNode.Row}+`,
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

    [YfmTableNode.Row]: {
        group: 'block',
        content: `${YfmTableNode.Cell}+`,
        isolating: true,
        parseDOM: [{tag: 'tr'}],
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
        group: 'block',
        content: 'block+',
        isolating: true,
        parseDOM: [{tag: 'td'}],
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
