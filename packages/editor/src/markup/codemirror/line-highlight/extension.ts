import {
    type Extension,
    type Range,
    RangeSet,
    RangeSetBuilder,
    StateEffect,
    StateField,
} from '@codemirror/state';
import {
    Decoration,
    type DecorationSet,
    EditorView,
    GutterMarker,
    gutterLineClass,
    lineNumbers,
} from '@codemirror/view';

export interface LineRange {
    from: number;
    to: number;
}

export interface LineHighlightOptions {
    initialRange?: LineRange;
    onLineClick?: (line: number) => void;
}

export const setHighlightedLine = StateEffect.define<LineRange | null>();

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
            return value;
        },
    });

    const highlightGutterDecoration = gutterLineClass.compute([highlightedLineField], (state) => {
        const range = state.field(highlightedLineField);

        if (range === null) {
            return RangeSet.empty;
        }

        const builder = new RangeSetBuilder<GutterMarker>();

        for (let line = range.from; line <= range.to; line++) {
            try {
                const cmLine = state.doc.line(line + 1);
                builder.add(cmLine.from, cmLine.from, highlightedGutterClass);
            } catch {}
        }

        return builder.finish();
    });

    const highlightLineDecorations = EditorView.decorations.compute(
        [highlightedLineField],
        (state): DecorationSet => {
            const range = state.field(highlightedLineField);

            if (range === null) {
                return Decoration.none;
            }

            const decorations: Range<Decoration>[] = [];

            for (let line = range.from; line <= range.to; line++) {
                try {
                    const cmLine = state.doc.line(line + 1);
                    decorations.push(highlightLineDecoration.range(cmLine.from));
                } catch {}
            }

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
