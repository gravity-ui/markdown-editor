import {
    ChangeSpec,
    EditorSelection,
    EditorState,
    Line,
    SelectionRange,
    StateCommand,
    Text,
    TransactionSpec,
} from '@codemirror/state';

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

function isFullLinesSelection(doc: Text, range: SelectionRange): boolean {
    const fromLine = doc.lineAt(range.from);
    const toLine = doc.lineAt(range.to);
    return range.from <= fromLine.from && range.to >= toLine.to;
}

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

export function inlineWrapTo(before: string, after: string = before): StateCommand {
    return ({state, dispatch}) => {
        const trSpec = state.changeByRange((range) => {
            const changes = state.changes([
                {from: range.from, insert: before},
                {from: range.to, insert: after},
            ]);
            return {
                changes,
                range: range.empty
                    ? EditorSelection.range(
                          range.anchor + before.length,
                          range.head + before.length,
                          range.goalColumn,
                          range.bidiLevel ?? undefined,
                      )
                    : range.map(changes),
            };
        });
        dispatch(state.update(trSpec));
        return true;
    };
}

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
        const tr: TransactionSpec = state.changeByRange((range) => {
            const hasMarkupBefore =
                state.sliceDoc(range.from - beforeLength, range.from) === before;
            const hasMarkupAfter = state.sliceDoc(range.to, range.to + afterLength) === after;

            const changeSpec: ChangeSpec[] = [];
            if (hasMarkupBefore && hasMarkupAfter) {
                changeSpec.push(
                    {from: range.from - beforeLength, to: range.from, insert: ''},
                    {from: range.to, to: range.to + afterLength, insert: ''},
                );
            } else {
                if (!hasMarkupBefore) {
                    changeSpec.push({
                        from: range.from,
                        insert: before,
                    });
                }
                if (!hasMarkupAfter) {
                    changeSpec.push({
                        from: range.to,
                        insert: after,
                    });
                }
            }

            const changes = state.changes(changeSpec);

            return {
                changes,
                range:
                    range.empty && !hasMarkupBefore
                        ? EditorSelection.range(
                              range.anchor + beforeLength,
                              range.head + beforeLength,
                              range.goalColumn,
                              range.bidiLevel ?? undefined,
                          )
                        : range.map(changes),
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

export const wrapPerLine =
    ({beforeText: before, skipEmptyLine = true}: WrapPerLineOptions): StateCommand =>
    ({state, dispatch}) => {
        const tr = state.changeByRange((range) => {
            const changes: ChangeSpec[] = [];

            const isSingleEmptyLine =
                range.anchor === range.head && state.doc.lineAt(range.head).length === 0;

            if (isSingleEmptyLine) {
                // Get markers from previous line for empty line case
                if (range.head > 1) {
                    const prevLine = state.doc.line(range.head - 1);
                    const markers = parseMarkers(prevLine.text);
                    const indentation = markers.join('');
                    changes.push({from: range.head + indentation.length, insert: before});
                } else {
                    changes.push({from: range.head, insert: before});
                }
            } else {
                // Calculate indentation from the first line
                const firstLine = state.doc.lineAt(range.from);
                let indentation = '';

                if (firstLine.number === 1) {
                    // First line of document - no indentation
                    indentation = '';
                } else {
                    const markers = parseMarkers(firstLine.text);

                    if (markers[markers.length - 1] === '  ') {
                        let currentLine = firstLine.number;
                        let currentMarkers = markers;
                        let lastMatchingLine = currentLine;

                        while (currentLine > 1) {
                            const prevLine = state.doc.line(currentLine - 1);
                            const prevMarkers = parseMarkers(prevLine.text);

                            if (prevMarkers.length !== currentMarkers.length) break;

                            const markersToCompare = [...currentMarkers];
                            const allButLastMatch = prevMarkers
                                .slice(0, -1)
                                .every((marker, i) => marker === markersToCompare[i]);

                            const lastPrevMarker = prevMarkers[prevMarkers.length - 1];

                            if (
                                allButLastMatch &&
                                lastPrevMarker !== markersToCompare[markersToCompare.length - 1]
                            ) {
                                // Use indentation from the line before this boundary
                                indentation = currentMarkers
                                    .slice(0, currentMarkers.length - 1)
                                    .join('');
                                break;
                            }

                            if (prevMarkers.every((marker, i) => marker === markersToCompare[i])) {
                                lastMatchingLine = currentLine - 1;
                                currentLine--;
                                currentMarkers = prevMarkers;
                                continue;
                            }

                            break;
                        }

                        // If we didn't find a boundary, use the last matching line's indentation
                        if (!indentation) {
                            const lastMatchingLineMarkers = parseMarkers(
                                state.doc.line(lastMatchingLine).text,
                            );
                            indentation = lastMatchingLineMarkers.join('');
                        }
                    } else {
                        // For non-double-space markers, look one line up
                        const prevLine = state.doc.line(firstLine.number);
                        const prevMarkers = parseMarkers(prevLine.text);
                        indentation = prevMarkers.join('');
                    }
                }

                // Apply the indentation to all lines
                iterateOverRangeLines(state.doc, range, (line) => {
                    if (skipEmptyLine && line.length === 0) return;
                    changes.push({from: line.from + indentation.length, insert: before});
                });
            }

            const changeSet = state.changes(changes);
            return {changes: changeSet, range: range.map(changeSet, 1)};
        });

        dispatch(state.update(tr));
        return true;
    };

export function iterateOverRangeLines(doc: Text, range: SelectionRange, fn: (line: Line) => void) {
    const from = doc.lineAt(range.from).number;
    const to = doc.lineAt(range.to).number;

    for (let i = from; i <= to; i++) {
        fn(doc.line(i));
    }
}

// Add the parseMarkers function here
function parseMarkers(text: string): string[] {
    const markers: string[] = [];
    let pos = 0;

    while (pos < text.length) {
        // Handle double-space indentation
        if (pos + 1 < text.length && text[pos] === ' ' && text[pos + 1] === ' ') {
            markers.push('  ');
            pos += 2;
            continue;
        }

        // Handle block quotes and list markers
        if (text[pos] === '>' || text[pos] === '-' || text[pos] === '*') {
            if (pos + 1 < text.length && text[pos + 1] === ' ') {
                markers.push(text[pos] + ' ');
                pos += 2;
                continue;
            }
        }

        break;
    }

    return markers;
}
