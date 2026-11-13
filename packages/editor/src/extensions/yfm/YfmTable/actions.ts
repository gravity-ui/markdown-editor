import type {Command} from 'prosemirror-state';

import {isDefaultOrEmptySelection} from 'src/utils/selection';

import {pType} from '../../base/BaseSchema';

import {yfmTableBodyType, yfmTableCellType, yfmTableRowType, yfmTableType} from './utils';

export const createYfmTableCommand: Command = (state, dispatch) => {
    if (!isDefaultOrEmptySelection(state.selection)) return false;

    if (dispatch) {
        const {schema} = state;

        const yfmTable = yfmTableType(schema);
        const yfmTableRow = yfmTableRowType(schema);
        const yfmTableBody = yfmTableBodyType(schema);
        const yfmTableCell = yfmTableCellType(schema);

        const table = yfmTable.create(
            null,
            yfmTableBody.create(null, [
                yfmTableRow.create(null, [
                    yfmTableCell.create(null, pType(schema).create()),
                    yfmTableCell.create(null, pType(schema).create()),
                ]),
                yfmTableRow.create(null, [
                    yfmTableCell.create(null, pType(schema).create()),
                    yfmTableCell.create(null, pType(schema).create()),
                ]),
            ]),
        );

        dispatch(state.tr.replaceSelectionWith(table).scrollIntoView());
    }

    return true;
};

export const createYfmTable = {
    isEnable: createYfmTableCommand,
    run: createYfmTableCommand,
};
