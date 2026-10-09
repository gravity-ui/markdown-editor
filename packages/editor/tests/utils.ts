import type {Command, EditorState, Transaction} from 'prosemirror-state';

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
