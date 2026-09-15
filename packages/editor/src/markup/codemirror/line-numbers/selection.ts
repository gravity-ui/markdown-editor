import {EditorSelection, type Text} from '@codemirror/state';
import {EditorView} from '@codemirror/view';

import type {InitialLineSelection} from './types';

export function lineSelectionPositions(
    doc: Text,
    selection: InitialLineSelection,
): {from: number; to: number} | null {
    if (doc.lines === 0) {
        return null;
    }

    const fromLine = Math.max(0, Math.min(selection.lineFrom, doc.lines - 1));
    const toLine = Math.max(
        fromLine,
        Math.min(selection.lineTo ?? selection.lineFrom, doc.lines - 1),
    );
    const firstLine = doc.line(fromLine + 1);
    const lastLine = doc.line(toLine + 1);

    return {from: firstLine.from, to: lastLine.to};
}

export function applyInitialLineSelection(
    view: EditorView,
    selection: InitialLineSelection,
    scrollMargin = 0,
): void {
    const positions = lineSelectionPositions(view.state.doc, selection);
    if (!positions) {
        return;
    }

    const isConnected = Boolean(view.dom.parentElement);

    view.dispatch({
        selection: EditorSelection.range(positions.from, positions.to),
        scrollIntoView: true,
        effects: isConnected
            ? [
                  EditorView.scrollIntoView(positions.from, {
                      y: 'start',
                      x: 'start',
                      yMargin: scrollMargin,
                  }),
              ]
            : undefined,
    });
}
