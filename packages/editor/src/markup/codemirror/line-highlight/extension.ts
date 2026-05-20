import {
    type EditorState,
    type Extension,
    RangeSet,
    RangeSetBuilder,
    StateEffect,
    StateField,
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

function highlightedLinePositions(state: EditorState, range: LineRange | null): number[] {
    if (!range) {
        return [];
    }

    const docLines = state.doc.lines;
    const positions: number[] = [];

    for (let line = range.from; line <= range.to; line++) {
        if (line < 0 || line >= docLines) {
            continue;
        }
        const cmLine = state.doc.line(line + 1);
        positions.push(cmLine.from);
    }

    return positions;
}

function mapLineRange(value: LineRange, tr: Transaction): LineRange | null {
    const oldDoc = tr.startState.doc;
    const oldFromLine = Math.max(0, Math.min(value.from, oldDoc.lines - 1));
    const oldToLine = Math.max(oldFromLine, Math.min(value.to, oldDoc.lines - 1));

    const oldFromPos = oldDoc.line(oldFromLine + 1).from;
    const oldToPos = oldDoc.line(oldToLine + 1).from;

    const newFromPos = tr.changes.mapPos(oldFromPos);
    const newToPos = tr.changes.mapPos(oldToPos);

    const newDoc = tr.state.doc;
    if (newDoc.lines === 0) {
        return null;
    }

    const newFromLine = newDoc.lineAt(newFromPos).number - 1;
    const newToLine = newDoc.lineAt(newToPos).number - 1;

    return {
        from: newFromLine,
        to: Math.min(newToLine, newDoc.lines - 1),
    };
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

    const highlightedLineField = StateField.define<LineRange | null>({
        create: () => initialRange,
        update(value, tr) {
            for (const effect of tr.effects) {
                if (effect.is(setHighlightedLine)) {
                    return effect.value;
                }
            }
            if (value === null || !tr.docChanged) {
                return value;
            }
            return mapLineRange(value, tr);
        },
    });

    const highlightGutterDecoration = gutterLineClass.compute([highlightedLineField], (state) => {
        const range = state.field(highlightedLineField);
        const positions = highlightedLinePositions(state, range);

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
            const range = state.field(highlightedLineField);
            const positions = highlightedLinePositions(state, range);

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
                const current = view.state.field(highlightedLineField);
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
