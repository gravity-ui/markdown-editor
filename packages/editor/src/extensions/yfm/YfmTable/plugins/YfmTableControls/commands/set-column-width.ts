import type {Command} from '#pm/state';
import {TableDesc} from 'src/table-utils/table-desc';

import {YfmTableAttr} from '../../../YfmTableSpecs';
import {formatColwidths} from '../utils';

const MIN_COLUMN_WIDTH = 40;

export type SetColumnWidthParams = {
    tablePos: number;
    widthsPx: (number | 'auto')[];
};

export const setColumnWidth = (params: SetColumnWidthParams): Command => {
    return (state, dispatch) => {
        const {tablePos, widthsPx} = params;
        const table = state.doc.nodeAt(tablePos);
        if (!table) return false;

        const tableDesc = TableDesc.create(table);
        if (!tableDesc) return false;

        const {cols} = tableDesc;
        if (widthsPx.length !== cols) return false;

        const arr = widthsPx.map((w) =>
            w === 'auto' ? 'auto' : `${Math.max(MIN_COLUMN_WIDTH, Math.round(w))}px`,
        );
        const newColwidths = formatColwidths(arr);

        const currentColwidths = table.attrs[YfmTableAttr.Colwidths] as string | null;
        if (currentColwidths === newColwidths) return false;

        if (dispatch) {
            dispatch(state.tr.setNodeAttribute(tablePos, YfmTableAttr.Colwidths, newColwidths));
        }

        return true;
    };
};
