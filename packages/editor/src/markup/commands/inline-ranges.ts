import {
    type ChangeDesc,
    EditorSelection,
    type EditorState,
    type Line,
    type SelectionRange,
    type Text,
} from '@codemirror/state';

/**
 * Maps a selection through changes and keeps its direction.
 * Non-empty selections include insertions at both bounds; bounds use old document positions.
 */
export function mapInlineRange(
    range: SelectionRange,
    changes: ChangeDesc,
    bounds: {from: number; to: number} = range,
): SelectionRange {
    if (range.empty) return range.map(changes);

    // Include new edge markers so the next command wraps them too.
    const from = changes.mapPos(bounds.from, -1);
    const to = changes.mapPos(bounds.to, 1);
    const backward = range.anchor > range.head;
    return EditorSelection.range(
        backward ? to : from,
        backward ? from : to,
        range.goalColumn,
        range.bidiLevel ?? undefined,
    );
}

/**
 * Splits selected text into ranges separated by blank lines, keeping single line breaks.
 * Returns the cursor range unchanged when the selection is empty.
 */
export function getInlineRanges(doc: Text, range: SelectionRange): {from: number; to: number}[] {
    // Keep an empty range so commands can insert markers around the cursor.
    if (range.empty) return [{from: range.from, to: range.to}];

    const ranges: {from: number; to: number}[] = [];
    let part: {from: number; to: number} | undefined;
    iterateOverRangeLines(doc, range, (line) => {
        const from = Math.max(line.from, range.from);
        const to = Math.min(line.to, range.to);
        // Skip selected whitespace and lines with no selected text.
        if (from >= to || /^[\t ]*$/.test(doc.sliceString(from, to))) {
            part = undefined;
        } else if (part) {
            // A single line break stays inside the same paragraph.
            part.to = to;
        } else {
            part = {from, to};
            ranges.push(part);
        }
    });
    return ranges;
}

/** Calls fn for each line from the range start to its end, including both boundary lines. */
export function iterateOverRangeLines(doc: Text, range: SelectionRange, fn: (line: Line) => void) {
    const from = doc.lineAt(range.from).number;
    const to = doc.lineAt(range.to).number;

    for (let i = from; i <= to; i++) {
        fn(doc.line(i));
    }
}

/**
 * Checks for markers just outside or inside the range edges.
 * Returns content bounds without these markers and flags for each marker found.
 */
export function getInlineMarkupRange(
    state: EditorState,
    range: {from: number; to: number},
    before: string,
    after: string,
) {
    let {from, to} = range;
    // Outer markers may be outside the selection after formatting.
    let hasMarkupBefore = state.sliceDoc(from - before.length, from) === before;
    let hasMarkupAfter = state.sliceDoc(to, to + after.length) === after;

    // Markers between paragraphs stay selected. Move the bounds past them.
    if (!hasMarkupBefore && to - from >= before.length) {
        hasMarkupBefore = state.sliceDoc(from, from + before.length) === before;
        if (hasMarkupBefore) from += before.length;
    }
    // Check the remaining length so opening and closing markers cannot overlap.
    if (!hasMarkupAfter && to - from >= after.length) {
        hasMarkupAfter = state.sliceDoc(to - after.length, to) === after;
        if (hasMarkupAfter) to -= after.length;
    }

    return {from, to, hasMarkupBefore, hasMarkupAfter};
}
