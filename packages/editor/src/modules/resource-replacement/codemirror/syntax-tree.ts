import {language, syntaxTree, syntaxTreeAvailable} from '@codemirror/language';
import type {EditorState, Text, Transaction} from '@codemirror/state';
import {type Input, type Parser, type Tree, TreeFragment} from '@lezer/common';

const trees = new WeakMap<Text, {parser: Parser; tree: Tree}>();

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

/** Reuse CM's completed tree, or finish an incremental parse without treating missing nodes as absent. */
export function completeResourceTree(state: EditorState, tr?: Transaction): Tree {
    const parser = state.facet(language)?.parser;
    if (!parser) throw new Error('Resource replacement requires a Markdown language');
    const doc = tr?.newDoc ?? state.doc;
    const cached = trees.get(doc);
    if (cached?.parser === parser) return cached.tree;
    const previous = trees.get(state.doc);
    const native = previous?.parser === parser ? previous.tree : syntaxTree(state);
    const complete = previous?.parser === parser || syntaxTreeAvailable(state, state.doc.length);
    if ((!tr || !tr.docChanged) && complete) {
        trees.set(doc, {parser, tree: native});
        return native;
    }
    let fragments = TreeFragment.addTree(native, [], !complete);
    if (tr?.docChanged) {
        const changes: Array<{fromA: number; toA: number; fromB: number; toB: number}> = [];
        tr.changes.iterChangedRanges((fromA, toA, fromB, toB) =>
            changes.push({fromA, toA, fromB, toB}),
        );
        fragments = TreeFragment.applyChanges(fragments, changes);
    }
    const tree = parser.parse(new DocumentInput(doc), fragments);
    trees.set(doc, {parser, tree});
    return tree;
}
