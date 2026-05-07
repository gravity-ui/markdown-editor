import {EditorSelection, EditorState, type Transaction} from '@codemirror/state';

import {colorify} from './marks';

function runColorify(doc: string, anchor: number, head: number = anchor) {
    const state = EditorState.create({doc, selection: EditorSelection.single(anchor, head)});
    const ref = {state};

    colorify('red')({
        state,
        dispatch: (tr: Transaction) => {
            ref.state = tr.state;
        },
    });

    return ref.state;
}

describe('colorify', () => {
    it('wraps a plain selection', () => {
        expect(runColorify('text', 0, 4).doc.toString()).toBe('{red}(text)');
    });

    it('unwraps the same color', () => {
        expect(runColorify('{red}(text)', 6, 10).doc.toString()).toBe('text');
    });

    it('replaces an existing color wrapper without nesting', () => {
        expect(runColorify('{blue}(text)', 7, 11).doc.toString()).toBe('{red}(text)');
    });

    it('inserts a wrapper at the cursor and keeps the cursor inside', () => {
        const next = runColorify('ab', 1);

        expect(next.doc.toString()).toBe('a{red}()b');
        expect(next.selection.main.from).toBe(7);
        expect(next.selection.main.to).toBe(7);
    });
});
