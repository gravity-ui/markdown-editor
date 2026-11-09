import {isNodeSelection} from '@gravity-ui/markdown-editor';
import type {Action, ExtensionAuto} from '@gravity-ui/markdown-editor/core';
import {chainCommands} from '@gravity-ui/markdown-editor/pm/commands';

import {LabelSpecs, labelNodeType} from './LabelSpecs';
import {editSelectedLabel, insertLabel, labelKeymap} from './commands';
import {addLabelAction} from './const';
import {existingLabelsPlugin} from './plugins/ExistingLabelsPlugin';
import {labelCursorPlugin} from './plugins/LabelCursorPlugin';
import {labelEditPlugin} from './plugins/LabelEditPlugin';
import {labelTooltipPlugin} from './plugins/LabelTooltipPlugin';
import {removeEmptyLabelPlugin} from './plugins/RemoveEmptyLabelPlugin';

import './Label.scss';
import '@gravity-ui/markdown-plugin-label/styles.css';

export const Label: ExtensionAuto = (builder) => {
    builder.use(LabelSpecs);

    builder
        .addPlugin(existingLabelsPlugin)
        .addPlugin(labelEditPlugin)
        .addPlugin(labelTooltipPlugin)
        .addPlugin(labelCursorPlugin)
        .addPlugin(removeEmptyLabelPlugin);
    builder.addKeymap(() => labelKeymap, builder.Priority.High);

    builder.addAction(addLabelAction, ({schema}) => {
        const type = labelNodeType(schema);
        const cmd = chainCommands(editSelectedLabel, insertLabel(''));

        return {
            isActive: (state) =>
                isNodeSelection(state.selection) && state.selection.node.type === type,
            isEnable: cmd,
            run: cmd,
        };
    });
};

declare global {
    namespace WysiwygEditor {
        interface Actions {
            [addLabelAction]: Action;
        }
    }
}
