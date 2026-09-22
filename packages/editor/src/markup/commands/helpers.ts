import {
    type ChangeDesc,
    type ChangeSpec,
    EditorSelection,
    type EditorState,
    type Line,
    type SelectionRange,
    type StateCommand,
    type Text,
    type TransactionSpec,
} from '@codemirror/state';

/** Returns extra line break counts before and after a block based on adjacent lines. */
export function getBlockExtraLineBreaks(
    state: EditorState,
    {from: fromLine, to: toLine}: {from: Line; to: Line},
) {
    let lineBreaksBefore = 0;
    if (fromLine.number === 1 || state.doc.line(fromLine.number - 1).length === 0)
        lineBreaksBefore = 0;
    else lineBreaksBefore = 1;

    let lineBreaksAfter = 0;
    if (toLine.number === state.doc.lines || state.doc.line(fromLine.number + 1).length === 0)
        lineBreaksAfter = 0;
    else lineBreaksAfter = 1;

    return {before: lineBreaksBefore, after: lineBreaksAfter};
}

/**
 * Builds a transaction to replace a full-line selection or insert markup after its last line.
 * Adds line breaks to separate the markup from nearby text.
 */
export function replaceOrInsertAfter(state: EditorState, markup: string): TransactionSpec {
    const selrange = state.selection.main;
    if (isFullLinesSelection(state.doc, selrange)) {
        const extraBreaks = getBlockExtraLineBreaks(state, {
            from: state.doc.lineAt(selrange.from),
            to: state.doc.lineAt(selrange.to),
        });
        return state.replaceSelection(
            state.lineBreak.repeat(extraBreaks.before) +
                markup +
                state.lineBreak.repeat(extraBreaks.after),
        );
    } else {
        const insert = state.lineBreak.repeat(2) + markup + state.lineBreak.repeat(2);
        const from = state.doc.lineAt(selrange.to).to;
        const selAnchor = from + insert.length - 2;
        return {changes: {from, insert}, selection: {anchor: selAnchor}};
    }
}

/** Checks whether the range covers all text on its first and last lines. */
function isFullLinesSelection(doc: Text, range: SelectionRange): boolean {
    const fromLine = doc.lineAt(range.from);
    const toLine = doc.lineAt(range.to);
    return range.from <= fromLine.from && range.to >= toLine.to;
}

/**
 * Creates a command that wraps the full lines of the main selection in block markers.
 * Adds block spacing and optional markers on each line.
 */
export const wrapToBlock = (
    before: string | ((arg: Pick<EditorState, 'lineBreak'>) => string),
    after: string | ((arg: Pick<EditorState, 'lineBreak'>) => string),
    perLine?: {
        before: string | ((arg: Pick<EditorState, 'lineBreak'>) => string);
        after: string | ((arg: Pick<EditorState, 'lineBreak'>) => string);
        /** @default false */
        skipEmptyLine?: boolean;
    },
): StateCommand => {
    return ({state, dispatch}) => {
        const beforeText = typeof before === 'function' ? before(state) : before;
        const afterText = typeof after === 'function' ? after(state) : after;

        const selrange = state.selection.main;
        const fromLine = state.doc.lineAt(selrange.from);
        const toLine = state.doc.lineAt(selrange.to);
        const extraBreaks = getBlockExtraLineBreaks(state, {from: fromLine, to: toLine});

        const beforeInsertion = state.lineBreak.repeat(extraBreaks.before) + beforeText;
        const afterInsertion = afterText + state.lineBreak.repeat(extraBreaks.after);
        const changeSpec: ChangeSpec[] = [{from: fromLine.from, insert: beforeInsertion}];

        const isEmptyLine = fromLine.number === toLine.number && fromLine.length === 0;
        let cursorShift = selrange.head + beforeInsertion.length;

        if (perLine) {
            const lineBeforeText =
                typeof perLine.before === 'function' ? perLine.before(state) : perLine.before;
            const lineAfterText =
                typeof perLine.after === 'function' ? perLine.after(state) : perLine.after;

            iterateOverRangeLines(state.doc, selrange, (line) => {
                if (perLine.skipEmptyLine && line.length === 0) return;
                if (lineBeforeText) {
                    changeSpec.push({from: line.from, insert: lineBeforeText});
                    if (isEmptyLine) cursorShift += lineBeforeText.length;
                }
                if (lineAfterText) changeSpec.push({from: line.to, insert: lineAfterText});
            });
        }

        changeSpec.push({from: toLine.to, insert: afterInsertion});

        const changes = state.changes(changeSpec);
        dispatch(
            state.update({
                changes,
                selection: isEmptyLine
                    ? EditorSelection.single(cursorShift)
                    : state.selection.map(changes),
            }),
        );

        return true;
    };
};

/**
 * Creates a command that wraps each selected paragraph part in inline markers.
 * Keeps markers selected, or places an empty cursor between them.
 */
export function inlineWrapTo(before: string, after: string = before): StateCommand {
    return ({state, dispatch}) => {
        const trSpec = state.changeByRange((range) => {
            const changes = state.changes(
                getInlineRanges(state.doc, range).flatMap(({from, to}) => [
                    {from, insert: before},
                    {from: to, insert: after},
                ]),
            );
            return {
                changes,
                range: range.empty
                    ? EditorSelection.range(
                          range.anchor + before.length,
                          range.head + before.length,
                          range.goalColumn,
                          range.bidiLevel ?? undefined,
                      )
                    : mapInlineRange(range, changes),
            };
        });
        dispatch(state.update(trSpec));
        return true;
    };
}

/**
 * Creates a command that toggles inline markers across all selected paragraph parts.
 * Removes markers when all parts have both; otherwise adds the missing markers.
 */
export function toggleInlineMarkupFactory(
    markup: string | {before: string; after?: string},
): StateCommand {
    const [before, after] =
        typeof markup === 'string'
            ? [markup, markup]
            : [markup.before, markup.after ?? markup.before];
    const beforeLength = before.length;
    const afterLength = after.length;

    return ({state, dispatch}) => {
        const ranges = state.selection.ranges.map((range) =>
            getInlineRanges(state.doc, range).map((part) =>
                getInlineMarkupRange(state, part, before, after),
            ),
        );
        const removeMarkup = ranges.every((parts) =>
            parts.every((part) => part.hasMarkupBefore && part.hasMarkupAfter),
        );
        let rangeIndex = 0;
        const tr: TransactionSpec = state.changeByRange((range) => {
            const parts = ranges[rangeIndex++];
            const changeSpec: ChangeSpec[] = [];
            const selectionBounds = {from: range.from, to: range.to};
            for (const {from, to, hasMarkupBefore, hasMarkupAfter} of parts) {
                if (removeMarkup) {
                    changeSpec.push(
                        {from: from - beforeLength, to: from, insert: ''},
                        {from: to, to: to + afterLength, insert: ''},
                    );
                } else {
                    if (!hasMarkupBefore) changeSpec.push({from, insert: before});
                    if (!hasMarkupAfter) changeSpec.push({from: to, insert: after});
                    // Include existing edge markers as well as new ones.
                    if (hasMarkupBefore) {
                        selectionBounds.from = Math.min(selectionBounds.from, from - beforeLength);
                    }
                    if (hasMarkupAfter) {
                        selectionBounds.to = Math.max(selectionBounds.to, to + afterLength);
                    }
                }
            }

            const changes = state.changes(changeSpec);

            return {
                changes,
                range:
                    range.empty && !parts[0].hasMarkupBefore
                        ? EditorSelection.range(
                              range.anchor + beforeLength,
                              range.head + beforeLength,
                              range.goalColumn,
                              range.bidiLevel ?? undefined,
                          )
                        : mapInlineRange(range, changes, selectionBounds),
            };
        });

        tr.scrollIntoView = true;

        dispatch(state.update(tr));

        return true;
    };
}

type WrapPerLineOptions = {
    beforeText: string;
    afterText?: string; // or false
    skipEmptyLine?: boolean; // default false
};

/**
 * Creates a command that inserts a prefix at the start of each selected line.
 * Skips empty lines by default, except when the cursor is on an empty line.
 */
export const wrapPerLine =
    ({beforeText: before, skipEmptyLine = true}: WrapPerLineOptions): StateCommand =>
    ({state, dispatch}) => {
        const tr = state.changeByRange((range) => {
            const changes: ChangeSpec[] = [];

            const isSingleEmptyLine =
                range.anchor === range.head && state.doc.lineAt(range.head).length === 0;
            if (isSingleEmptyLine) {
                changes.push({from: range.head, insert: before});
            } else {
                iterateOverRangeLines(state.doc, range, (line) => {
                    if (skipEmptyLine && line.length === 0) return;
                    changes.push({from: line.from, insert: before});
                });
            }

            const changeSet = state.changes(changes);
            return {changes: changeSet, range: range.map(changeSet, 1)};
        });

        dispatch(state.update(tr));
        return true;
    };

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
        // Skip blank lines and a last line with no selected text.
        if (from >= to || /^[\t ]*$/.test(line.text)) {
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
function getInlineMarkupRange(
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
