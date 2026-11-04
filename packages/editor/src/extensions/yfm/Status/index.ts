import type {Command} from 'prosemirror-state';

import type {Action, ExtensionAuto} from '../../../core';
import {i18n} from '../../../i18n/status';
import {isNodeSelection} from '../../../utils/selection';

import {StatusSpecs, statusType} from './StatusSpecs';
import {statusTooltipPlugin} from './StatusTooltip';
import {insertStatus, statusKeymap} from './commands';
import {removeEmptyStatusPlugin} from './remove-empty-plugin';

import './index.scss';

export * from './StatusSpecs';
export {insertStatus, updateStatus} from './commands';
export type {StatusAttrs} from './commands';

const statusAction = 'addStatus';

export const Status: ExtensionAuto = (builder) => {
    builder.use(StatusSpecs);

    builder.addPlugin(statusTooltipPlugin).addPlugin(removeEmptyStatusPlugin);
    builder.addKeymap(() => statusKeymap);

    builder.addAction(statusAction, ({schema}) => {
        const type = statusType(schema);
        const cmd: Command = (state, dispatch, view) =>
            insertStatus(i18n('default_caption'))(state, dispatch, view);

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
            [statusAction]: Action;
        }
    }
}
