import type {NodeSpec} from 'prosemirror-model';

import {TableRole} from '../../../../table-utils';
import type {PlaceholderOptions} from '../../../../utils/placeholder';

import {YfmTableAttr, YfmTableNode} from './const';

const DEFAULT_CELL_PLACEHOLDER = 'Table cell';

export type YfmTableSchemaOptions = {
    /**
     * @deprecated: use placeholder option in BehaviorPreset instead.
     */
    yfmTableCellPlaceholder?: NonNullable<NodeSpec['placeholder']>['content'];
};

export const getSchemaSpecs = (
    opts?: YfmTableSchemaOptions,
    placeholder?: PlaceholderOptions,
): Record<YfmTableNode, NodeSpec> => ({
    [YfmTableNode.Table]: {
        group: 'block yfm-table',
        content: `${YfmTableNode.Body}`,
        isolating: true,
        definingAsContext: true,
        attrs: {
            [YfmTableAttr.HeaderRows]: {default: 0},
        },
        parseDOM: [
            {
                tag: 'table',
                priority: 200,
                getAttrs(dom) {
                    const attr = dom.getAttribute(YfmTableAttr.HeaderRows);
                    const fromDataAttr = attr ? Math.max(0, parseInt(attr, 10) || 0) : 0;
                    const theadRows = dom.querySelectorAll('thead > tr').length;
                    return {[YfmTableAttr.HeaderRows]: fromDataAttr || theadRows};
                },
            },
        ],
        toDOM(node) {
            const headerRows = node.attrs[YfmTableAttr.HeaderRows];
            const attrs = headerRows ? node.attrs : {};
            return ['table', attrs, 0];
        },
        selectable: true,
        allowSelection: true,
        selectAll: 'node',
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
        attrs: {
            [YfmTableAttr.Colspan]: {default: null},
            [YfmTableAttr.Rowspan]: {default: null},
            [YfmTableAttr.CellAlign]: {default: null},
            [YfmTableAttr.CellBg]: {default: null},
        },
        parseDOM: [
            {tag: 'td', priority: 200},
            {tag: 'th', priority: 200},
        ],
        toDOM(node) {
            return ['td', node.attrs, 0];
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
        selectAll: 'content',
        allowSelection: false,
        complex: 'leaf',
    },
});
