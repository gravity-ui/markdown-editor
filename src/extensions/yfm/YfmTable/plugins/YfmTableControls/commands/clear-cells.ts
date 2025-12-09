import type {Command} from '#pm/state';
import {pType} from 'src/extensions/base/specs';
import {type CellPos, TableDesc} from 'src/table-utils/table-desc';

export type ClearCellsParams = {
    tablePos: number;
    rows?: number[];
    cols?: number[];
};

export const clearCells = (params: ClearCellsParams): Command => {
    return (state, dispatch) => {
        const table = state.doc.nodeAt(params.tablePos);
        const tableDesc = table && TableDesc.create(table)?.bind(params.tablePos);
        if (!tableDesc) return false;

        if (!dispatch) return true;

        const {tr} = state;
        const paragraph = pType(state.schema);

        const clear = (cells: CellPos[]) => {
            for (const pos of cells) {
                if (pos.type !== 'real') continue;
                tr.replaceWith(
                    tr.mapping.map(pos.from + 1),
                    tr.mapping.map(pos.to - 1),
                    paragraph.create(),
                );
            }
        };

        if (params.rows) {
            for (const rowIdx of params.rows) {
                const cellsPos = tableDesc.getPosForRowCells(rowIdx);
                clear(cellsPos);
            }
        }
        if (params.cols) {
            for (const colIdx of params.cols) {
                const cellsPos = tableDesc.getPosForColumn(colIdx);
                clear(cellsPos);
            }
        }

        if (tr.docChanged) dispatch(tr);

        return true;
    };
};
