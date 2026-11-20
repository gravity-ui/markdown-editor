import type {Slice} from 'prosemirror-model';
import type {Command, EditorState, Transaction} from 'prosemirror-state';

import {readMatrixSlice} from '../src/table-utils/matrix/slice';
import {DirectiveSyntaxContext, type DirectiveSyntaxOption} from '../src/utils/directive';

export function applyCommand(state: EditorState, command: Command) {
    let tr!: Transaction;
    const dispatch = (newTr: Transaction) => {
        tr = newTr;
    };
    const res = command(state, dispatch);
    return {res, tr};
}

export class DirectiveContext extends DirectiveSyntaxContext {
    setOption(option: DirectiveSyntaxOption | undefined) {
        this.option = option;
    }
}

export function readValidMatrixSlice(slice: Slice) {
    const result = readMatrixSlice(slice);
    if (!result || result === 'invalid') throw new Error('Expected a valid matrix slice');
    return result.source;
}
