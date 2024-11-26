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
    // Example: If we're in a structure like:
    //   * Top level
    //     * Second level <- cursor here
    //     * Another second level
    if (markers[markers.length - 1] === '  ') {
        // Track our position as we look backwards through the document
        // Starting from current line like "    * Second level"
        let currentLine = line.number;
        let currentMarkers = markers;

        // Traverse up the document to find the start of the current structure
        // This helps maintain proper indentation when pasting
        while (currentLine > 1) {
            const prevLine = state.doc.line(currentLine - 1);
            const prevMarkers = parseMarkers(prevLine.text);

            // Exit if marker count changes
            // Example: Going from "    * Second level" to "* Top level" (4 markers to 1)
            if (prevMarkers.length !== currentMarkers.length) break;

            const markersToCompare = [...currentMarkers];

            // Check if the indentation pattern matches except for the last marker
            // This helps detect transitions between different list levels
            // Example: "  * " matches between levels, but last marker might differ
            const allButLastMatch = prevMarkers
                .slice(0, -1)
                .every((marker, i) => marker === markersToCompare[i]);

            const lastPrevMarker = prevMarkers[prevMarkers.length - 1];

            // Detect boundary between different structures with same indentation
            // Example: Transitioning between:
            //   * List item
            //     * Nested item
            //     ```
            //     code block    <- Different structure, same indentation
            if (
                allButLastMatch &&
                lastPrevMarker !== markersToCompare[markersToCompare.length - 1]
            ) {
                break;
            }

            // If the line has exactly the same marker pattern, keep going up
            // Example: Multiple lines at same nesting level:
            //     * Second level item
            //     * Another second level item <- identical pattern
            if (prevMarkers.every((marker, i) => marker === markersToCompare[i])) {
                currentLine--;
                currentMarkers = prevMarkers;
                continue;
            }

            // If we reach here, we've found a different structure
            // This could be transitioning from a list to a blockquote, etc.
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
