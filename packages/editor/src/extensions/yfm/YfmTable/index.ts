import type {Action, ExtensionWithOptions} from '../../../core';
import {goToNextCell} from '../../../table-utils';

import {YfmTableNode, YfmTableSpecs, type YfmTableSpecsOptions} from './YfmTableSpecs';
import {createYfmTable} from './actions';
import {backspaceCommand} from './commands/backspace';
import {goToNextRow} from './commands/goToNextRow';
import {createYfmTableGeometry} from './geometry';
import {yfmTableMatrix} from './matrix';
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

// TODO [MAJOR]: enable by default and remove options: headerRows, cellBackground

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
    /**
     * Enables header rows functionality in table (toggle row as header, visual decoration).
     * The `controls` property must also be `true`.
     *
     * Available with @diplodoc/transform v4.75.0 or higher.
     * @default false
     */
    headerRows?: boolean;
    /**
     * Enables cell background color picker for table cells.
     * The `controls` property must also be `true`.
     *
     * Available with @diplodoc/transform v4.75.0 or higher.
     * @default false
     */
    cellBackground?: boolean;
};

export const YfmTable: ExtensionWithOptions<YfmTableOptions> = (builder, options) => {
    builder.use(YfmTableSpecs, options);
    builder.overrideNodeSpec(YfmTableNode.Table, (spec) => ({
        ...spec,
        tableGeometry: createYfmTableGeometry,
        tableMatrix: yfmTableMatrix,
    }));

    builder.addKeymap(() => ({
        Tab: goToNextCell('next'),
        'Shift-Tab': goToNextCell('prev'),
        ArrowDown: goToNextRow('down'),
        ArrowUp: goToNextRow('up'),
        Backspace: backspaceCommand,
    }));
    builder.addAction(action, () => createYfmTable);
    builder.addPlugin((deps) =>
        yfmTableTransformPastedPlugin({
            ...deps,
            matrixEnabled: builder.context.get('tableCellSelection') === true,
        }),
    );

    if (options.controls !== false) {
        builder.addPlugin((deps) =>
            yfmTableControlsPlugins({
                dndEnabled: options.dnd !== false,
                headerRowsEnabled: options.headerRows === true,
                cellBackgroundEnabled: options.cellBackground === true,
                cellSelectionEnabled: builder.context.get('tableCellSelection') === true,
            })(deps),
        );
    }
};

declare global {
    namespace WysiwygEditor {
        interface Actions {
            [action]: Action;
        }
    }
}
