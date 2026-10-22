import type {Command} from 'prosemirror-state';

import type {Action, ExtensionAuto} from '../../../core';
import {isNodeSelection} from '../../../utils/selection';

import {LabelSpecs, labelType} from './LabelSpecs';
import {labelTooltipPlugin} from './LabelTooltip';
import {insertLabel, labelKeymap} from './commands';
import {labelCursorPlugin} from './cursor-plugin';
import {labelEditPlugin} from './edit-state';
import {existingLabelsPlugin} from './existing-labels-plugin';
import {removeEmptyLabelPlugin} from './remove-empty-plugin';

export * from './LabelSpecs';
export {insertLabel, removeEmptyLabel, updateLabel} from './commands';
export type {LabelAttrs} from './commands';

const labelAction = 'addLabel';

export const Label: ExtensionAuto = (builder) => {
    builder.use(LabelSpecs);

    builder
        .addPlugin(existingLabelsPlugin)
        .addPlugin(labelEditPlugin)
        .addPlugin(labelTooltipPlugin)
        .addPlugin(labelCursorPlugin)
        .addPlugin(removeEmptyLabelPlugin);
    builder.addKeymap(() => labelKeymap, builder.Priority.High);

    builder.addAction(labelAction, ({schema}) => {
        const type = labelType(schema);
        const cmd: Command = (state, dispatch, view) => insertLabel('')(state, dispatch, view);

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
            [labelAction]: Action;
        }
    }
}
