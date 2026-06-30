import {history, redo, undo} from '@codemirror/commands';
import {EditorState} from '@codemirror/state';
import {type DecorationSet, EditorView} from '@codemirror/view';

import {lineHighlight, setHighlightedLine} from './extension';

function resolveDecorationSet(
    decorations: DecorationSet | ((view: EditorView) => DecorationSet),
    view: EditorView,
): DecorationSet {
    return typeof decorations === 'function' ? decorations(view) : decorations;
}

function highlightedLineStarts(view: EditorView): number[] {
    const decorationSets = view.state.facet(EditorView.decorations);
    const positions: number[] = [];

    for (const decorations of decorationSets) {
        resolveDecorationSet(decorations, view).between(0, view.state.doc.length, (from) => {
            positions.push(from);
        });
    }

    return positions;
}

function lineIndexAt(view: EditorView, pos: number): number {
    return view.state.doc.lineAt(pos).number - 1;
}

function highlightedLines(view: EditorView): number[] {
    return highlightedLineStarts(view).map((pos) => lineIndexAt(view, pos));
}

function createView(doc: string, initialRange?: {from: number; to: number}) {
    return new EditorView({
        state: EditorState.create({
            doc,
            extensions: [history(), lineHighlight({initialRange})],
        }),
    });
}

describe('lineHighlight', () => {
    const doc = 'line0\nline1\nline2\nline3\nline4';

    it('moves highlight when lines are inserted above', () => {
        const view = createView(doc, {from: 2, to: 2});

        const line2From = view.state.doc.line(3).from;
        view.dispatch({changes: {from: line2From, insert: '\nnew\n'}});

        expect(highlightedLines(view)).toEqual([4]);

        view.destroy();
    });

    it('moves highlight when lines are deleted above', () => {
        const view = createView(doc, {from: 2, to: 2});

        const line0 = view.state.doc.line(1);
        view.dispatch({changes: {from: line0.from, to: line0.to + 1}});

        expect(highlightedLines(view)).toEqual([1]);

        view.destroy();
    });

    it('keeps highlight on the same line when editing its content', () => {
        const view = createView(doc, {from: 2, to: 2});

        const line2 = view.state.doc.line(3);
        view.dispatch({changes: {from: line2.from, insert: 'xxx'}});

        expect(highlightedLines(view)).toEqual([2]);

        view.destroy();
    });

    it('restores highlight position after undo and redo', () => {
        const view = createView(doc, {from: 2, to: 2});

        const line2From = view.state.doc.line(3).from;
        view.dispatch({changes: {from: line2From, insert: '\nnew\n'}});
        expect(highlightedLines(view)).toEqual([4]);

        undo(view);
        expect(highlightedLines(view)).toEqual([2]);

        redo(view);
        expect(highlightedLines(view)).toEqual([4]);

        view.destroy();
    });

    it('clears highlight when the highlighted line is deleted', () => {
        const view = createView(doc, {from: 2, to: 2});

        const line2 = view.state.doc.line(3);
        view.dispatch({changes: {from: line2.from, to: line2.to + 1}});

        expect(highlightedLines(view)).toEqual([]);

        view.destroy();
    });

    it('clears highlight when the highlighted range is deleted', () => {
        const view = createView(doc, {from: 1, to: 3});

        const from = view.state.doc.line(2).from;
        const to = view.state.doc.line(4).to + 1;
        view.dispatch({changes: {from, to}});

        expect(highlightedLines(view)).toEqual([]);

        view.destroy();
    });

    it('updates highlight when set via effect after document changes', () => {
        const view = createView(doc);

        view.dispatch({effects: setHighlightedLine.of({from: 1, to: 1})});
        view.dispatch({changes: {from: 0, insert: '\n'}});

        expect(highlightedLines(view)).toEqual([2]);

        view.destroy();
    });
});
