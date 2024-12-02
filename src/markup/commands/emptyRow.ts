import {EditorSelection, StateCommand} from '@codemirror/state';

const str = '&nbsp;\n\n';

export const insertEmptyRow: StateCommand = ({state, dispatch}) => {
    const trSpec = state.changeByRange((range) => {
        const lineFrom = state.doc.lineAt(range.from);

        return {
            changes: [{from: lineFrom.from, insert: str}],
            range: EditorSelection.range(
                range.anchor + str.length,
                range.head + str.length,
                range.goalColumn,
                range.bidiLevel ?? undefined,
            ),
        };
    });

    dispatch(state.update(trSpec));
    return true;
};
