import {
    type ChangeSpec,
    EditorSelection,
    type EditorState,
    type StateCommand,
} from '@codemirror/state';

import {getInlineRanges, mapInlineRange, toggleInlineMarkupFactory} from './helpers';

const COLOR_WRAPPER_RE = /\{([a-z0-9-]+)\}\($/i;

type ColorWrapper = {
    color: string;
    from: number;
    to: number;
};

function findColorWrapperBefore(state: EditorState, pos: number): ColorWrapper | null {
    const from = state.doc.lineAt(pos).from;
    const textBefore = state.sliceDoc(from, pos);
    const match = textBefore.match(COLOR_WRAPPER_RE);

    if (!match) {
        return null;
    }

    return {
        color: match[1],
        from: pos - match[0].length,
        to: pos,
    };
}

export const colorify = (color: string): StateCommand => {
    const opener = `{${color}}(`;

    return ({state, dispatch}) => {
        const tr = state.changeByRange((range) => {
            const changes: ChangeSpec[] = [];
            let wrapped = true;

            for (const {from, to} of getInlineRanges(state.doc, range)) {
                const wrapper = findColorWrapperBefore(state, from);

                if (!wrapper || state.sliceDoc(to, to + 1) !== ')') {
                    wrapped = false;
                    changes.push({from, insert: opener}, {from: to, insert: ')'});
                } else if (wrapper.color === color) {
                    changes.push(
                        {from: wrapper.from, to: wrapper.to, insert: ''},
                        {from: to, to: to + 1, insert: ''},
                    );
                } else {
                    changes.push({from: wrapper.from, to: wrapper.to, insert: opener});
                }
            }

            const changeSet = state.changes(changes);

            // Existing wrappers keep the content selected so the next click finds them again.
            return {
                changes: changeSet,
                range: wrapped
                    ? range.map(changeSet, 1)
                    : range.empty
                      ? EditorSelection.range(
                            range.anchor + opener.length,
                            range.head + opener.length,
                            range.goalColumn,
                            range.bidiLevel ?? undefined,
                        )
                      : mapInlineRange(range, changeSet),
            };
        });

        dispatch(state.update({...tr, scrollIntoView: true}));

        return true;
    };
};

export const toggleBold = toggleInlineMarkupFactory('**');
export const toggleItalic = toggleInlineMarkupFactory('_');
export const toggleStrikethrough = toggleInlineMarkupFactory('~~');
export const toggleUnderline = toggleInlineMarkupFactory('++');
export const toggleMonospace = toggleInlineMarkupFactory('##');
export const toggleMarked = toggleInlineMarkupFactory('==');
