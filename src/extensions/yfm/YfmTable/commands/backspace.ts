import {chainCommands} from '#pm/commands';
import type {Node, NodeType, ResolvedPos} from '#pm/model';
import {type Command, TextSelection} from '#pm/state';
import {pType} from 'src/extensions/base/specs';
import {range} from 'src/lodash';
import {isTableCellNode, isTableNode, isTableRowNode} from 'src/table-utils';
import {TableDesc} from 'src/table-utils/table-desc';
import {isNodeSelection, isTextSelection} from 'src/utils/selection';

import {yfmTableBodyType, yfmTableRowType, yfmTableType} from '../utils';

const removeCellNodeContent: Command = (state, dispatch) => {
    const sel = state.selection;
    if (!isNodeSelection(sel)) return false;
    const selNode = sel.node;
    if (isTableRowNode(selNode)) {
        // remove the table row
        dispatch?.(state.tr.deleteSelection());
        return true;
    }
    if (isTableCellNode(selNode)) {
        if (dispatch) {
            // clearing the table cell
            const from = sel.from + 1;
            const to = sel.to - 1;
            let tr = state.tr.delete(from, to);
            tr = tr.setSelection(TextSelection.create(tr.doc, from));
            dispatch(tr);
        }
        return true;
    }
    return false;
};

export const clearSelectedCells: Command = (state, dispatch) => {
    const sel = state.selection;
    if (!isTextSelection(sel)) return false;
    const {$from, $to} = sel;

    const sharedDepth = $from.sharedDepth($to.pos);
    const commonAncestor = $from.node(sharedDepth);
    const {schema} = commonAncestor.type;

    if (
        !isAnyOfTypes(commonAncestor, [
            yfmTableType(schema),
            yfmTableBodyType(schema),
            yfmTableRowType(schema),
        ])
    )
        return false;

    const tablePos = findTablePos($from, sharedDepth);
    if (typeof tablePos !== 'number') return false;
    const tableNode = $from.doc.nodeAt(tablePos);
    if (!tableNode) return false;
    const tableDesc = TableDesc.create(tableNode)?.bind(tablePos);
    if (!tableDesc) return false;

    if (dispatch) {
        const tr = state.tr;

        const cells = range(0, tableDesc.rows)
            .flatMap((rowIdx) => tableDesc.getPosForRowCells(rowIdx))
            .filter((cell) => cell.type === 'real');

        const isAllSelected =
            $from.pos <= cells[0].from + 2 && $to.pos >= cells[cells.length - 1].to - 2;

        if (isAllSelected) {
            // all table content is selected, we should remove table
            tr.replaceWith(tablePos, tablePos + tableNode.nodeSize, pType(schema).create());
            tr.setSelection(TextSelection.create(tr.doc, tablePos + 1));
        } else {
            for (const cell of cells) {
                if ($from.pos > cell.to) continue;
                if ($to.pos < cell.from) break;

                const from = Math.max($from.pos, cell.from + 1);
                const to = Math.min($to.pos, cell.to - 1);

                tr.delete(tr.mapping.map(from), tr.mapping.map(to));
                tr.setSelection(TextSelection.near(tr.doc.resolve(tr.mapping.map(to)), -1));
            }
        }

        dispatch(tr.scrollIntoView());
    }

    return true;
};

export const backspaceCommand = chainCommands(removeCellNodeContent, clearSelectedCells);

function isAnyOfTypes(node: Node, types: NodeType[]): boolean {
    return types.some((type) => type === node.type);
}

function findTablePos($pos: ResolvedPos, startDepth: number): number | null {
    const ASCENTS = 5;
    let depth = startDepth;
    while (depth >= 0 && startDepth - depth <= ASCENTS) {
        const node = $pos.node(depth);
        if (isTableNode(node)) {
            return $pos.before(depth);
        }
        depth--;
    }
    return null;
}
