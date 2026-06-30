import {
    type EditorState,
    type Extension,
    RangeSet,
    RangeSetBuilder,
    StateEffect,
    StateField,
    type Text,
    type Transaction,
} from '@codemirror/state';
import {
    Decoration,
    type DecorationSet,
    EditorView,
    GutterMarker,
    gutterLineClass,
    lineNumbers,
} from '@codemirror/view';

import type {LineRange, MarkupLineNumbersConfig} from './types';

export interface LineHighlightOptions {
    initialRange?: LineRange;
    onLineClick?: (line: number) => void;
}

export const setHighlightedLine = StateEffect.define<LineRange | null>();

/** Document positions spanning from the start of the first line to the end of the last line. */
type HighlightAnchor = {from: number; to: number};

function lineRangeToAnchor(doc: Text, range: LineRange): HighlightAnchor | null {
    if (doc.lines === 0) {
        return null;
    }

    const fromLine = Math.max(0, Math.min(range.from, doc.lines - 1));
    const toLine = Math.max(fromLine, Math.min(range.to, doc.lines - 1));
    const firstLine = doc.line(fromLine + 1);
    const lastLine = doc.line(toLine + 1);

    return {from: firstLine.from, to: lastLine.to};
}

function anchorOverlapsChanges(anchor: HighlightAnchor, tr: Transaction): boolean {
    let overlaps = false;

    tr.changes.iterChangedRanges((fromA, toA) => {
        if (fromA < anchor.to && toA > anchor.from) {
            overlaps = true;
        }
    });

    return overlaps;
}

function mapHighlightAnchor(anchor: HighlightAnchor, tr: Transaction): HighlightAnchor | null {
    const newFrom = tr.changes.mapPos(anchor.from, 1);
    const newTo = tr.changes.mapPos(anchor.to, -1);

    if (tr.state.doc.length === 0) {
        return null;
    }

    if (newTo < newFrom) {
        return null;
    }

    // When highlighted content is fully removed, mapPos collapses the range to a point.
    if (newTo === newFrom && anchorOverlapsChanges(anchor, tr)) {
        return null;
    }

    return {from: newFrom, to: newTo};
}

function highlightedLinePositions(state: EditorState, anchor: HighlightAnchor | null): number[] {
    if (!anchor || anchor.to < anchor.from) {
        return [];
    }

    const doc = state.doc;
    if (doc.length === 0) {
        return [];
    }

    const fromLine = doc.lineAt(anchor.from).number;
    const toLine = doc.lineAt(Math.min(anchor.to, doc.length)).number;
    const positions: number[] = [];

    for (let line = fromLine; line <= toLine; line++) {
        positions.push(doc.line(line).from);
    }

    return positions;
}

const highlightLineDecoration = Decoration.line({
    attributes: {class: 'cm-highlighted-line'},
});

const highlightedGutterClass = new (class extends GutterMarker {
    elementClass = 'cm-highlighted-gutter-line';
})();

const highlightLineTheme = EditorView.baseTheme({
    '.cm-highlighted-line': {
        backgroundColor: 'var(--g-color-base-selection) !important',
    },
    '.cm-highlighted-gutter-line': {
        backgroundColor: 'var(--g-color-base-selection) !important',
        color: 'var(--g-color-text-primary) !important',
    },
    '.cm-lineNumbers .cm-gutterElement': {
        cursor: 'pointer',
    },
});

export function lineHighlight(options?: LineHighlightOptions): Extension {
    const initialRange = options?.initialRange ?? null;

    const highlightedLineField = StateField.define<HighlightAnchor | null>({
        create(state) {
            return initialRange ? lineRangeToAnchor(state.doc, initialRange) : null;
        },
        update(value, tr) {
            for (const effect of tr.effects) {
                if (effect.is(setHighlightedLine)) {
                    return effect.value ? lineRangeToAnchor(tr.state.doc, effect.value) : null;
                }
            }

            if (value === null || !tr.docChanged) {
                return value;
            }

            return mapHighlightAnchor(value, tr);
        },
    });

    const highlightGutterDecoration = gutterLineClass.compute([highlightedLineField], (state) => {
        const anchor = state.field(highlightedLineField);
        const positions = highlightedLinePositions(state, anchor);

        if (!positions.length) {
            return RangeSet.empty;
        }

        const builder = new RangeSetBuilder<GutterMarker>();
        for (const from of positions) {
            builder.add(from, from, highlightedGutterClass);
        }

        return builder.finish();
    });

    const highlightLineDecorations = EditorView.decorations.compute(
        [highlightedLineField],
        (state): DecorationSet => {
            const anchor = state.field(highlightedLineField);
            const positions = highlightedLinePositions(state, anchor);

            if (!positions.length) {
                return Decoration.none;
            }

            const decorations = positions.map((from) => highlightLineDecoration.range(from));

            return Decoration.set(decorations);
        },
    );

    const clickableLineNumbers = lineNumbers({
        domEventHandlers: {
            click(view, line) {
                const lineNum = view.state.doc.lineAt(line.from).number - 1;
                const anchor = view.state.field(highlightedLineField);
                const current =
                    anchor === null
                        ? null
                        : {
                              from: view.state.doc.lineAt(anchor.from).number - 1,
                              to:
                                  view.state.doc.lineAt(Math.min(anchor.to, view.state.doc.length))
                                      .number - 1,
                          };
                const isSingleSelected =
                    current !== null && current.from === lineNum && current.to === lineNum;
                view.dispatch({
                    effects: setHighlightedLine.of(
                        isSingleSelected ? null : {from: lineNum, to: lineNum},
                    ),
                });
                options?.onLineClick?.(lineNum);
                return true;
            },
        },
    });

    return [
        highlightedLineField,
        highlightLineDecorations,
        highlightGutterDecoration,
        clickableLineNumbers,
        highlightLineTheme,
    ];
}

export function markupLineNumbers(
    config: Pick<
        MarkupLineNumbersConfig,
        'highlightLines' | 'initialSelectedLines' | 'onLineClick'
    >,
): Extension {
    if (config.highlightLines) {
        return lineHighlight({
            initialRange: config.initialSelectedLines,
            onLineClick: config.onLineClick,
        });
    }

    return lineNumbers();
}
