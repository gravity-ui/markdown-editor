import type {Node, ResolvedPos} from '#pm/model';
import {type Command, type EditorState, TextSelection, type Transaction} from '#pm/state';
import type {EditorView} from '#pm/view';
import {pType} from 'src/extensions/base/specs';
import {findParentTableFromPos} from 'src/table-utils';
import {getChildByIndex} from 'src/utils/node-children';

import {
    findParentBodyOnPos,
    findParentCellOnPos,
    findParentHeadOnPos,
    findParentRowOnPos,
} from './helpers';

const moveToNextRow = (
    $pos: ResolvedPos,
    state: EditorState,
    dispatch: EditorView['dispatch'] | undefined,
) => {
    const tableRes = findParentTableFromPos($pos);
    if (!tableRes) return false;

    const tableHeadResult = findParentHeadOnPos($pos);
    const tableBodyResult = findParentBodyOnPos($pos);
    if (!tableHeadResult && !tableBodyResult) return false;

    const tableRowResult = findParentRowOnPos($pos);
    const tableCellResult = findParentCellOnPos($pos);
    if (!tableRowResult || !tableCellResult) return false;

    const cellIndex = $pos.index(tableCellResult.depth - 1);
    const rowIndex = $pos.index(tableRowResult.depth - 1);

    if (!dispatch) return true;

    const goToNextRow = (tr: Transaction, nextRow: Node, nextRowPos: number) => {
        const cell = getChildByIndex(nextRow, cellIndex);
        if (cell) {
            const cellPos = nextRowPos + 1 + cell.offset;
            tr.setSelection(TextSelection.create(tr.doc, cellPos + cell.node.nodeSize - 1));
        } else {
            // fallback if cell not found
            const $rowEnd = tr.doc.resolve(nextRowPos + nextRow.nodeSize - 1);
            tr.setSelection(TextSelection.near($rowEnd, -1));
        }
    };

    const exitTable = (tr: Transaction) => {
        const afterTablePos = tableRes.pos + tableRes.node.nodeSize;
        tr.insert(afterTablePos, pType(state.schema).create());
        tr.setSelection(TextSelection.create(tr.doc, afterTablePos + 1));
    };

    const tr = state.tr;

    if (tableHeadResult) {
        // in table head
        const tableBody = getChildByIndex(tableRes.node, tableRes.node.childCount - 1);
        if (tableBody && tableBody.node !== tableHeadResult.node && tableBody.node.firstChild) {
            goToNextRow(tr, tableBody.node.firstChild, tableRes.start + tableBody.offset + 1);
        } else {
            // no table body or it is empty
            exitTable(tr);
        }
    } else {
        // in table body
        const nextRow = getChildByIndex(tableBodyResult!.node, rowIndex + 1);
        if (nextRow) {
            goToNextRow(tr, nextRow.node, tableBodyResult!.start + nextRow.offset);
        } else {
            // pos in last row
            exitTable(tr);
        }
    }

    dispatch(tr.scrollIntoView());

    return true;
};

export const moveToNextRowCommand: Command = (state, dispatch) => {
    return (
        moveToNextRow(state.selection.$head, state, dispatch) ||
        moveToNextRow(state.selection.$anchor, state, dispatch)
    );
};
