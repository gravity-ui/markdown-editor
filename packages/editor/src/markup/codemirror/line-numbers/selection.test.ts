import {EditorSelection, EditorState} from '@codemirror/state';
import {EditorView} from '@codemirror/view';

import {applyInitialLineSelection, lineSelectionPositions} from './selection';

describe('lineSelectionPositions', () => {
    const doc = 'line0\nline1\nline2\nline3\nline4';

    it('returns positions for a single line', () => {
        const state = EditorState.create({doc});
        expect(lineSelectionPositions(state.doc, {lineFrom: 2})).toEqual({from: 12, to: 17});
    });

    it('returns positions for a line range', () => {
        const state = EditorState.create({doc});
        expect(lineSelectionPositions(state.doc, {lineFrom: 1, lineTo: 3})).toEqual({
            from: 6,
            to: 23,
        });
    });

    it('clamps out-of-range line numbers', () => {
        const state = EditorState.create({doc});
        expect(lineSelectionPositions(state.doc, {lineFrom: -5, lineTo: 100})).toEqual({
            from: 0,
            to: 29,
        });
    });
});

describe('applyInitialLineSelection', () => {
    const doc = 'line0\nline1\nline2\nline3\nline4';

    it('selects the requested lines', () => {
        const view = new EditorView({state: EditorState.create({doc})});

        applyInitialLineSelection(view, {lineFrom: 1, lineTo: 2});

        const {from, to} = view.state.selection.main;
        expect(from).toBe(6);
        expect(to).toBe(17);
        expect(EditorSelection.range(from, to).eq(view.state.selection.main)).toBe(true);

        view.destroy();
    });
});
