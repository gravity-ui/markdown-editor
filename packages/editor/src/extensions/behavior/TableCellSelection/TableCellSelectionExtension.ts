import type {ExtensionAuto} from '#core';
import {
    tableCellSelectionPlugin,
    tableCellSelectionTextKeymap,
} from 'src/table-utils/cell-selection/plugin';

export {TableCellSelection} from 'src/table-utils/cell-selection/selection';

export const TableCellSelectionExtension: ExtensionAuto = (builder) => {
    builder.addPlugin(tableCellSelectionPlugin, builder.Priority.VeryHigh);
    // Run after list keymaps and before table keymaps.
    builder.addPlugin(tableCellSelectionTextKeymap, builder.Priority.Medium + 1);
};
