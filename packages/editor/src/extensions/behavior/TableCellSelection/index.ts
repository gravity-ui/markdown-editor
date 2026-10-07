import type {ExtensionAuto} from '#core';
import {tableCellSelectionPlugin} from 'src/table-utils/cell-selection/plugin';

export const TableCellSelection: ExtensionAuto = (builder) => {
    builder.addPlugin(tableCellSelectionPlugin, builder.Priority.VeryHigh);
};
