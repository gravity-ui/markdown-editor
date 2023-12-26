import type {NodeSpec} from 'prosemirror-model';

import {TableRole} from '../../../../table-utils';
import {PlaceholderOptions} from '../../../../utils/placeholder';

import {YfmTableNode} from './const';

import type {YfmTableSpecsOptions} from './index';

const DEFAULT_CELL_PLACEHOLDER = 'Table cell';

export const getSpec = (
    opts?: YfmTableSpecsOptions,
    placeholder?: PlaceholderOptions,
): Record<YfmTableNode, NodeSpec> => ({
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
            content:
                placeholder?.[YfmTableNode.Cell] ??
                opts?.yfmTableCellPlaceholder ??
                DEFAULT_CELL_PLACEHOLDER,
            alwaysVisible: true,
        },
        tableRole: TableRole.Cell,
        selectable: false,
        allowSelection: false,
        complex: 'leaf',
    },
});
