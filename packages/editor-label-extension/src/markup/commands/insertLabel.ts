import {EditorSelection, type StateCommand} from '@gravity-ui/markdown-editor/cm/state';
import {labelDirectiveName} from '@gravity-ui/markdown-plugin-label';

const prefix = `:${labelDirectiveName}[`;

/** Escapes brackets that are not escaped yet, so the selected markup stays inside the caption. */
const escapeBrackets = (text: string) =>
    text.replace(/\\[\s\S]|[[\]]/g, (match) => (match.length === 1 ? `\\${match}` : match));

/** Wraps the selection into a label; an empty selection leaves the cursor inside the brackets. */
export const insertLabel: StateCommand = ({state, dispatch}) => {
    dispatch(
        state.update(
            state.changeByRange(({from, to}) => {
                const caption = escapeBrackets(state.sliceDoc(from, to));
                const start = from + prefix.length;

                return {
                    changes: {from, to, insert: `${prefix}${caption}]`},
                    range: EditorSelection.range(start, start + caption.length),
                };
            }),
            {scrollIntoView: true},
        ),
    );
    return true;
};
