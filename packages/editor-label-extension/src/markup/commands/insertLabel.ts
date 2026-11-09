import {EditorSelection, type StateCommand} from '@gravity-ui/markdown-editor/cm/state';
import {labelDirectiveName} from '@gravity-ui/markdown-plugin-label';

const prefix = `:${labelDirectiveName}[`;

/** Wraps the selection into a label; an empty selection leaves the cursor inside the brackets. */
export const insertLabel: StateCommand = ({state, dispatch}) => {
    dispatch(
        state.update(
            state.changeByRange(({from, to}) => ({
                changes: [
                    {from, insert: prefix},
                    {from: to, insert: ']'},
                ],
                range: EditorSelection.range(from + prefix.length, to + prefix.length),
            })),
            {scrollIntoView: true},
        ),
    );
    return true;
};
