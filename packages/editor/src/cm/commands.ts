import {
    redo as nativeRedo,
    redoDepth as nativeRedoDepth,
    undo as nativeUndo,
    undoDepth as nativeUndoDepth,
} from '@codemirror/commands';
import type {StateCommand} from '@codemirror/state';

import {historyLocked} from '../markup/codemirror/history-lock';

export * from '@codemirror/commands';
export const undo: StateCommand = (target) =>
    !target.state.facet(historyLocked) && nativeUndo(target);
export const redo: StateCommand = (target) =>
    !target.state.facet(historyLocked) && nativeRedo(target);

/** Number of available undo steps; zero while history is locked. */
export const undoDepth: typeof nativeUndoDepth = (state) =>
    state.facet(historyLocked) ? 0 : nativeUndoDepth(state);
/** Number of available redo steps; zero while history is locked. */
export const redoDepth: typeof nativeRedoDepth = (state) =>
    state.facet(historyLocked) ? 0 : nativeRedoDepth(state);
