import {EditorState, Line, StateCommand} from '@codemirror/state';

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

function getBlockExtraLineBreaks(state: EditorState, from: Line) {
    let before = 0;
    let after = 0;
    let selection = 2;

    if (from.text) {
        before = 2;
    } else if (from.number > 1 && state.doc.line(from.number - 1).text) {
        before = 1;
    }

    if (from.number + 1 <= state.doc.lines && state.doc.line(from.number + 1).text) {
        after = 1;
        selection = 1;
    }
    if (from.number === state.doc.lines) {
        after = 2;
        selection = 0;
    }

    return {before, after, selection};
}
