import type {Action, ExtensionWithOptions} from '../../../core';
import {goToNextCell} from '../../../table-utils';

import {YfmTableSpecs, YfmTableSpecsOptions} from './YfmTableSpecs';
import {createYfmTable} from './actions';
import {backspaceCommand} from './commands/backspace';
import {goToNextRow} from './commands/goToNextRow';
import {tableControlsPlugin} from './plugins/YfmTableControls/buttons';
import {tableTransformPastedPlugin} from './plugins/tableTransformPastedPlugin';

const action = 'createYfmTable';

export {convertToYfmTable} from './commands/convert-table';
export {
    YfmTableNode,
    yfmTableType,
    yfmTableBodyType,
    yfmTableRowType,
    yfmTableCellType,
} from './YfmTableSpecs';

export type YfmTableOptions = YfmTableSpecsOptions & {};

export const YfmTable: ExtensionWithOptions<YfmTableOptions> = (builder, options) => {
    builder.use(YfmTableSpecs, options);

    builder.addKeymap(() => ({
        Tab: goToNextCell('next'),
        'Shift-Tab': goToNextCell('prev'),
        ArrowDown: goToNextRow('down'),
        ArrowUp: goToNextRow('up'),
        Backspace: backspaceCommand,
    }));
    builder.addAction(action, () => createYfmTable);
    builder.addPlugin(tableTransformPastedPlugin);
    builder.addPlugin(tableControlsPlugin);
};

declare global {
    namespace YfmEditor {
        interface Actions {
            [action]: Action;
        }
    }
}
