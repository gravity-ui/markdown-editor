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
        return {
            changes: {
                from: state.doc.lineAt(selrange.to).to,
                insert: state.lineBreak.repeat(2) + markup + state.lineBreak.repeat(2),
            },
        };
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
        const changeSpec: ChangeSpec[] = [
            {from: fromLine.from, insert: beforeInsertion},
            {from: toLine.to, insert: afterInsertion},
        ];

        const isEmptyLine = fromLine.number === toLine.number && fromLine.length === 0;

        if (perLine) {
            const lineBeforeText =
                typeof perLine.before === 'function' ? perLine.before(state) : perLine.before;
            const lineAfterText =
                typeof perLine.after === 'function' ? perLine.after(state) : perLine.after;

            iterateOverRangeLines(state.doc, selrange, (line) => {
                if (perLine.skipEmptyLine && line.length === 0) return;
                if (lineBeforeText) changeSpec.push({from: line.from, insert: lineBeforeText});
                if (lineAfterText) changeSpec.push({from: line.to, insert: lineAfterText});
            });
        }

        const changes = state.changes(changeSpec);
        dispatch(
            state.update({
                changes,
                selection: isEmptyLine
                    ? EditorSelection.single(selrange.head + beforeInsertion.length)
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

            iterateOverRangeLines(state.doc, range, (line) => {
                if (skipEmptyLine && line.length === 0) return;
                changes.push({from: line.from, insert: before});
            });

            const changeSet = state.changes(changes);
            return {changes: changeSet, range: range.map(changeSet)};
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
