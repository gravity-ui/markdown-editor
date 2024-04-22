import {ChangeSpec, EditorSelection, StateCommand} from '@codemirror/state';

export const toH1 = toHeading(1);
export const toH2 = toHeading(2);
export const toH3 = toHeading(3);
export const toH4 = toHeading(4);
export const toH5 = toHeading(5);
export const toH6 = toHeading(6);

function toHeading(level: 1 | 2 | 3 | 4 | 5 | 6): StateCommand {
    const re = /^\s*#*\s*/;
    const str = Array<string>(level).fill('#').join('') + ' ';
    return ({state, dispatch}) => {
        const trSpec = state.changeByRange((range) => {
            const lineFrom = state.doc.lineAt(range.from);
            const lineTo = state.doc.lineAt(range.to);

            // cursor in empty line
            if (lineFrom.number === lineTo.number && lineFrom.length === 0) {
                return {
                    changes: [{from: lineFrom.from, insert: str}],
                    // move cursor to end of inserted string with sharps (#)
                    range: EditorSelection.range(
                        range.anchor + str.length,
                        range.head + str.length,
                        range.goalColumn,
                        range.bidiLevel ?? undefined,
                    ),
                };
            }

            // multiline selection
            const changes: ChangeSpec[] = [];
            for (let i = lineFrom.number; i <= lineTo.number; i++) {
                const line = state.doc.line(i);
                // ignore empty line in multiline selection
                if (line.length === 0 && !range.empty) continue;

                // replace sharps (#) at start of line
                const replacedLength = re.exec(line.text)?.[0].length ?? 0;
                changes.push({from: line.from, to: line.from + replacedLength, insert: str});
            }

            const changeSet = state.changes(changes);
            return {
                changes: changeSet,
                range: range.map(changeSet),
            };
        });
        dispatch(state.update(trSpec));
        return true;
    };
}
