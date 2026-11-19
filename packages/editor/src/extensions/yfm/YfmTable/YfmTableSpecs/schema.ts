import type {NodeSpec} from 'prosemirror-model';

import type {ExtensionAuto} from '#core';

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
                    const rows = Array.from((dom as HTMLTableElement).rows);
                    let headers = 0;
                    for (const row of rows) {
                        if (
                            row.parentElement?.tagName !== 'THEAD' &&
                            (!row.cells.length ||
                                Array.from(row.cells).some((cell) => cell.tagName !== 'TH'))
                        )
                            break;
                        headers++;
                    }
                    return {
                        [YfmTableAttr.HeaderRows]:
                            attr === null
                                ? headers
                                : Math.min(rows.length, Math.max(0, parseInt(attr, 10) || 0)),
                    };
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
            // The schema wraps rows in one body. Keep all direct HTML row groups in that body.
            {
                tag: 'table > thead, table > tbody, table > tfoot',
                context: `${YfmTableNode.Table}/|${YfmTableNode.Table}/${YfmTableNode.Body}/`,
                priority: 201,
                skip: true,
            },
            {tag: 'tbody', priority: 200},
            {tag: 'thead', priority: 200},
            {tag: 'tfoot', priority: 200},
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
        content: `${YfmTableNode.Cell}*`,
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
            {tag: 'td', priority: 200, getAttrs: getCellAttrs},
            {tag: 'th', priority: 200, getAttrs: getCellAttrs},
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

export const YfmTableSchemaSpecs: ExtensionAuto<YfmTableSchemaOptions> = (builder, opts) => {
    const schemaSpecs = getSchemaSpecs(opts, builder.context.get('placeholder'));

    builder
        .addNodeSpec(YfmTableNode.Table, () => schemaSpecs[YfmTableNode.Table])
        .addNodeSpec(YfmTableNode.Body, () => schemaSpecs[YfmTableNode.Body])
        .addNodeSpec(YfmTableNode.Row, () => schemaSpecs[YfmTableNode.Row])
        .addNodeSpec(YfmTableNode.Cell, () => schemaSpecs[YfmTableNode.Cell]);
};

function getCellAttrs(dom: HTMLElement) {
    const align =
        dom.getAttribute('align') ||
        dom.style.textAlign ||
        // Older HTML may carry the alignment only in this attribute.
        dom.getAttribute('cell-align') ||
        null;
    return {
        [YfmTableAttr.Colspan]: dom.getAttribute(YfmTableAttr.Colspan),
        [YfmTableAttr.Rowspan]: dom.getAttribute(YfmTableAttr.Rowspan),
        [YfmTableAttr.CellAlign]:
            dom.getAttribute(YfmTableAttr.CellAlign) ??
            (align && !align.startsWith('cell-align-')
                ? `cell-align-${dom.style.verticalAlign || 'top'}-${align}`
                : align),
        [YfmTableAttr.CellBg]:
            dom.getAttribute(YfmTableAttr.CellBg) ||
            dom.getAttribute('bgcolor') ||
            dom.style.backgroundColor ||
            null,
    };
}
