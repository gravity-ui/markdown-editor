import {EditorSelection, EditorState, type Transaction} from '@codemirror/state';
import {describe, expect, it} from 'vitest';

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
    it('should wrap a plain selection', () => {
        expect(runColorify('text', 0, 4).doc.toString()).toBe('{red}(text)');
    });

    it('should unwrap the same color', () => {
        expect(runColorify('{red}(text)', 6, 10).doc.toString()).toBe('text');
    });

    it('should replace an existing color wrapper without nesting', () => {
        const next = runColorify('{blue}(text)', 7, 11);

        expect(next.doc.toString()).toBe('{red}(text)');
        expect(next.selection.main).toEqual(EditorSelection.range(6, 10));
    });

    it('should insert a wrapper at the cursor and keep the cursor inside', () => {
        const next = runColorify('ab', 1);

        expect(next.doc.toString()).toBe('a{red}()b');
        expect(next.selection.main.from).toBe(7);
        expect(next.selection.main.to).toBe(7);
    });
});
