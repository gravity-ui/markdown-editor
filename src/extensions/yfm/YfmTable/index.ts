import type {Action, ExtensionWithOptions} from '../../../core';
import {goToNextCell} from '../../../table-utils';

import {YfmTableSpecs, YfmTableSpecsOptions} from './YfmTableSpecs';
import {createYfmTable} from './actions';
import {backspaceCommand} from './commands/backspace';
import {goToNextRow} from './commands/goToNextRow';
import {yfmTableControlsPlugin} from './plugins/YfmTableControls/buttons';
import {yfmTableTransformPastedPlugin} from './plugins/yfmTableTransformPastedPlugin';

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
    builder.addPlugin(yfmTableTransformPastedPlugin);
    builder.addPlugin(yfmTableControlsPlugin);
};

declare global {
    namespace YfmEditor {
        interface Actions {
            [action]: Action;
        }
    }
}
