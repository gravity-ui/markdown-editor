import {history, redo, undo} from 'prosemirror-history';
import type {Command} from 'prosemirror-state';

import type {Action, ActionSpec, ExtensionAuto, Keymap} from '../../../core';
import {withLogAction} from '../../../utils/keymap';

enum HistoryAction {
    Undo = 'undo',
    Redo = 'redo',
}

export type HistoryOptions = {
    config?: Parameters<typeof history>[0];
    undoKey?: string | null;
    redoKey?: string | null;
};

export const History: ExtensionAuto<HistoryOptions> = (builder, opts) => {
    builder.addPlugin(() => history(opts?.config));
    builder.addKeymap(() => {
        const {undoKey, redoKey} = opts ?? {};
        const bindings: Keymap = {};
        if (undoKey) bindings[undoKey] = withLogAction('undo', undo);
        if (redoKey) bindings[redoKey] = withLogAction('redo', redo);
        return bindings;
    });
    builder
        .addAction(HistoryAction.Undo, createHistoryAction(undo))
        .addAction(HistoryAction.Redo, createHistoryAction(redo));
};

declare global {
    namespace WysiwygEditor {
        interface Actions {
            [HistoryAction.Undo]: Action;
            [HistoryAction.Redo]: Action;
        }
    }
}

function createHistoryAction(command: Command) {
    return (): ActionSpec => ({
        isEnable: command,
        run: command,
    });
}
