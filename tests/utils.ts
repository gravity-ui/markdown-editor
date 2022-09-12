import type {Command, EditorState, Transaction} from 'prosemirror-state';

export function applyCommand(state: EditorState, command: Command) {
    let tr!: Transaction;
    const dispatch = (newTr: Transaction) => {
        tr = newTr;
    };
    const res = command(state, dispatch);
    return {res, tr};
}
