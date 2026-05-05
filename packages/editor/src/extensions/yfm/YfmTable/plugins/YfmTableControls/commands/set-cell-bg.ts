import type {Command} from '#pm/state';
import {TableDesc} from 'src/table-utils/table-desc';

import {YfmTableAttr} from '../../../YfmTableSpecs/const';

export type SetCellBgParams = {
    tablePos: number;
    rows?: number[];
    cols?: number[];
    bg: string | null;
};

export const setCellBg = (params: SetCellBgParams): Command => {
    return (state, dispatch) => {
        const table = state.doc.nodeAt(params.tablePos);
        const tableDesc = table && TableDesc.create(table)?.bind(params.tablePos);
        if (!tableDesc) return false;

        if (!dispatch) return true;

        const {tr} = state;

        const apply = (cellPos: ReturnType<typeof tableDesc.getPosForRowCells>[number]) => {
            if (cellPos.type !== 'real') return;
            const node = state.doc.nodeAt(cellPos.from);
            if (!node) return;
            tr.setNodeAttribute(
                tr.mapping.map(cellPos.from),
                YfmTableAttr.CellBg,
                params.bg || null,
            );
        };

        if (params.rows) {
            for (const rowIdx of params.rows) {
                for (const pos of tableDesc.getPosForRowCells(rowIdx)) apply(pos);
            }
        }
        if (params.cols) {
            for (const colIdx of params.cols) {
                for (const pos of tableDesc.getPosForColumn(colIdx)) apply(pos);
            }
        }

        if (tr.docChanged) dispatch(tr);

        return true;
    };
};
