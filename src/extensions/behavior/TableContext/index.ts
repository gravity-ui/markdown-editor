import {ExtensionAuto} from '../../../core';

import {tableCellContextPlugin} from './TableCellContextPlugin';

export const TableContextExtension: ExtensionAuto = (builder) => {
    builder.addPlugin(tableCellContextPlugin);
};
