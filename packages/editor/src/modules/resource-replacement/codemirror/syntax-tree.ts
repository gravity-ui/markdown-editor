import {language, syntaxTree, syntaxTreeAvailable} from '@codemirror/language';
import type {EditorState, Text, Transaction} from '@codemirror/state';
import type {Input, Tree} from '@lezer/common';

class DocumentInput implements Input {
    readonly lineChunks = false;
    private readonly doc: Text;
    constructor(doc: Text) {
        this.doc = doc;
    }
    get length() {
        return this.doc.length;
    }
    chunk(from: number) {
        return this.doc.sliceString(from, Math.min(from + 4096, this.length));
    }
    read(from: number, to: number) {
        return this.doc.sliceString(from, to);
    }
}

/** Reuse CM's complete tree for the same document, or parse the required document in full. */
export function completeResourceTree(state: EditorState, tr?: Transaction): Tree {
    const parser = state.facet(language)?.parser;
    if (!parser) throw new Error('Resource replacement requires a Markdown language');
    const doc = tr?.newDoc ?? state.doc;
    if ((!tr || !tr.docChanged) && syntaxTreeAvailable(state, doc.length)) {
        return syntaxTree(state);
    }
    return parser.parse(new DocumentInput(doc));
}
