import type {EditorState, Line, StateCommand} from '@codemirror/state';

export const insertEmptyRow: StateCommand = ({state, dispatch}) => {
    const emptyRowMarkup = '&nbsp;';

    const tr = () => {
        const selrange = state.selection.main;
        const {before, after, selection} = getBlockExtraLineBreaks(
            state,
            state.doc.lineAt(selrange.from),
        );

        const insert =
            state.lineBreak.repeat(before) + emptyRowMarkup + state.lineBreak.repeat(after);

        const from = state.doc.lineAt(selrange.to).to;
        const selAnchor = from + insert.length + selection;

        return {changes: {from, insert}, selection: {anchor: selAnchor}};
    };

    dispatch(state.update(tr()));
    return true;
};

function getBlockExtraLineBreaks(state: EditorState, line: Line) {
    let before = 0;
    let after = 0;
    let selection = 2;

    if (line.text) {
        before = 2;
    } else if (line.number > 1 && state.doc.line(line.number - 1).text) {
        before = 1;
    }

    if (line.number + 1 <= state.doc.lines && state.doc.line(line.number + 1).text) {
        after = 1;
        selection = 1;
    } else if (
        line.number + 1 <= state.doc.lines &&
        !state.doc.line(line.number + 1).text &&
        line.number + 2 > state.doc.lines
    ) {
        after = 1;
        selection = 1;
    } else if (line.number === state.doc.lines) {
        after = 2;
        selection = 0;
    }

    return {before, after, selection};
}
