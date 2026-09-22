import {Compartment, EditorState, type Transaction} from '@codemirror/state';

import {historyLocked} from '../markup/codemirror/history-lock';

import {history, isolateHistory, redo, redoDepth, undo, undoDepth} from './commands';

test('history depths reflect the lock without losing undo or redo steps', () => {
    const lock = new Compartment();
    const target = {
        state: EditorState.create({extensions: [history(), lock.of(historyLocked.of(false))]}),
        dispatch(transaction: Transaction) {
            target.state = transaction.state;
        },
    };
    for (const text of ['first', 'second']) {
        target.dispatch(
            target.state.update({
                changes: {from: target.state.doc.length, insert: text},
                annotations: isolateHistory.of('full'),
            }),
        );
    }
    expect(undo(target)).toBe(true);
    expect(target.state.doc.toString()).toBe('first');
    expect([undoDepth(target.state), redoDepth(target.state)]).toEqual([1, 1]);

    target.dispatch(target.state.update({effects: lock.reconfigure(historyLocked.of(true))}));
    expect([undoDepth(target.state), redoDepth(target.state)]).toEqual([0, 0]);
    expect(undo(target)).toBe(false);
    expect(redo(target)).toBe(false);
    expect(target.state.doc.toString()).toBe('first');

    target.dispatch(target.state.update({effects: lock.reconfigure(historyLocked.of(false))}));
    expect([undoDepth(target.state), redoDepth(target.state)]).toEqual([1, 1]);
    expect(redo(target)).toBe(true);
    expect(target.state.doc.toString()).toBe('firstsecond');
    expect([undoDepth(target.state), redoDepth(target.state)]).toEqual([2, 0]);
});
