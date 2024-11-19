import type {EditorView} from '@codemirror/view';
import {parseMarkers} from './utils';

/**
 * Handles pasting text into a markdown editor, maintaining proper indentation
 * and formatting for nested lists and blockquotes. The function preserves the
 * existing markers (like list bullets or blockquote symbols) and applies them
 * to each new line of the pasted content.
 */
export function handleMarkdownPaste(pastedText: string, editor: EditorView): boolean {
    const {state, dispatch} = editor;
    const {from} = state.selection.main;
    const line = state.doc.lineAt(from);
    const lineStart = line.text;

    const markers = parseMarkers(lineStart);
    if (markers.length === 0) return false;

    // Special handling for nested lists
    if (markers[markers.length - 1] === '  ') {
        let currentLine = line.number;
        let currentMarkers = markers;

        while (currentLine > 1) {
            const prevLine = state.doc.line(currentLine - 1);
            const prevMarkers = parseMarkers(prevLine.text);

            if (prevMarkers.length !== currentMarkers.length) break;

            const allButLastMatch = prevMarkers
                .slice(0, -1)
                .every((marker, i) => marker === currentMarkers[i]);

            const lastPrevMarker = prevMarkers[prevMarkers.length - 1];

            if (allButLastMatch && lastPrevMarker !== currentMarkers[currentMarkers.length - 1]) {
                break;
            }

            if (prevMarkers.every((marker, i) => marker === currentMarkers[i])) {
                currentLine--;
                currentMarkers = prevMarkers;
                continue;
            }

            break;
        }
    }

    const lines = pastedText.split('\n');

    const prefix = markers.reduce((acc, marker) => {
        if (marker === '> ') return acc + '> ';
        // For numbered lists, replace with equivalent spaces
        if (marker.match(/^\d+\. /)) {
            return acc + ' '.repeat(marker.length);
        }
        return acc + '  ';
    }, '');

    const modifiedText = [lines[0], ...lines.slice(1).map((line) => prefix + line)].join('\n');

    dispatch({
        changes: {from, to: from, insert: modifiedText},
        selection: {anchor: from + modifiedText.length},
    });

    return true;
}
