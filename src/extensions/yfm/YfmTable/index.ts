import {Plugin} from 'prosemirror-state';
import {goToNextCell} from '../../../table-utils';
import type {Action, ExtensionWithOptions} from '../../../core';
import {createYfmTable} from './actions';
import {goToNextRow} from './commands/goToNextRow';
import {backspaceCommand} from './commands/backspace';
import {fixPastedTableBodies} from './paste';
import {YfmTableSpecs, YfmTableSpecsOptions} from './YfmTableSpecs';

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

    builder
        .addKeymap(() => ({
            Tab: goToNextCell('next'),
            'Shift-Tab': goToNextCell('prev'),
            ArrowDown: goToNextRow('down'),
            ArrowUp: goToNextRow('up'),
            Backspace: backspaceCommand,
        }))

        .addAction(action, () => createYfmTable);

    builder.addPlugin(
        ({schema}) =>
            new Plugin({
                props: {
                    transformPasted(slice) {
                        return fixPastedTableBodies(slice, schema);
                    },
                },
            }),
    );
};

declare global {
    namespace YfmEditor {
        interface Actions {
            [action]: Action;
        }
    }
}
