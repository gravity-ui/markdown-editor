import type {Command} from 'prosemirror-state';

import {pType} from 'src/extensions/base/specs';
import {TableCellSelection} from 'src/table-utils/cell-selection/selection';
import {MAX_COLSPAN, TableDesc} from 'src/table-utils/table-desc';

import {YfmTableAttr, YfmTableNode} from '../../../YfmTableSpecs/const';

import {applyRowChanges, getCellRange} from './table-result';

const MAX_ROWSPAN = 65_534;

export const mergeSelectedCells: Command = (state, dispatch) => {
    const {selection} = state;
    if (!(selection instanceof TableCellSelection)) return false;
    const {geometry, rect, tablePos} = selection;
    if (geometry.table.type.name !== YfmTableNode.Table || selection.ranges.length < 2)
        return false;

    const width = rect.right - rect.left;
    const height = rect.bottom - rect.top;
    if (width > MAX_COLSPAN || height > MAX_ROWSPAN) return false;
    const desc = TableDesc.create(geometry.table);
    if (!desc || (rect.top < desc.headerRows && desc.headerRows < rect.bottom)) return false;
    if (!dispatch) return true;

    const emptyParagraph = pType(state.schema).create();
    const cells = geometry.cellsInRect(rect);
    const blocks = cells.flatMap(({node}) =>
        node.childCount === 1 && node.child(0).eq(emptyParagraph) ? [] : node.content.content,
    );
    const first = cells[0].node;
    const merged = first.type.create(
        {
            ...first.attrs,
            [YfmTableAttr.Colspan]: width > 1 ? width : null,
            [YfmTableAttr.Rowspan]: height > 1 ? height : null,
        },
        blocks.length ? blocks : emptyParagraph,
        first.marks,
    );
    const changes = [];
    for (let row = rect.top; row < rect.bottom; row++) {
        const range = getCellRange(
            desc,
            row,
            rect.left,
            rect.right,
            row === rect.top ? merged : null,
        );
        if (row === rect.top || range.from !== range.to)
            changes.push({index: row, ranges: [range]});
    }
    const tr = state.tr;
    const result = applyRowChanges(tr, tablePos, desc, changes)?.cellAt(rect.top, rect.left);
    if (!result) return false;
    tr.setSelection(TableCellSelection.create(tr.doc, tablePos + result.offset));
    dispatch(tr);
    return true;
};
