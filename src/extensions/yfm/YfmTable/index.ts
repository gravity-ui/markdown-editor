import type {Action, ExtensionWithOptions} from '../../../core';
import {goToNextCell} from '../../../table-utils';

import {YfmTableSpecs, type YfmTableSpecsOptions} from './YfmTableSpecs';
import {createYfmTable} from './actions';
import {backspaceCommand} from './commands/backspace';
import {goToNextRow} from './commands/goToNextRow';
import {yfmTableControlsPlugins} from './plugins/YfmTableControls';
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

export type YfmTableOptions = YfmTableSpecsOptions & {
    /**
     * Enables floating controls for table.
     * @default true
     */
    controls?: boolean;
    /**
     * Enables drag-d-drop rows and columns in table.
     * The `controls` property must also be `true`.
     * @default true
     */
    dnd?: boolean;
};

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

    if (options.controls !== false) {
        builder.addPlugin(yfmTableControlsPlugins({dndEnabled: options.dnd !== false}));
    }
};

declare global {
    namespace WysiwygEditor {
        interface Actions {
            [action]: Action;
        }
    }
}
