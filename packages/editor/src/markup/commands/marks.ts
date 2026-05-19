import {EditorSelection, type EditorState, type StateCommand} from '@codemirror/state';

import {toggleInlineMarkupFactory} from './helpers';

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
            const wrapper = findColorWrapperBefore(state, range.from);
            const hasClosingParen = state.sliceDoc(range.to, range.to + 1) === ')';
            let changes;

            if (wrapper && hasClosingParen) {
                if (wrapper.color === color) {
                    changes = [
                        {from: wrapper.from, to: wrapper.to, insert: ''},
                        {from: range.to, to: range.to + 1, insert: ''},
                    ];
                } else {
                    changes = [{from: wrapper.from, to: wrapper.to, insert: opener}];
                }
            } else {
                changes = [
                    {from: range.from, insert: opener},
                    {from: range.to, insert: ')'},
                ];
            }

            const changeSet = state.changes(changes);

            return {
                changes: changeSet,
                range:
                    range.empty && !(wrapper && hasClosingParen)
                        ? EditorSelection.range(
                              range.anchor + opener.length,
                              range.head + opener.length,
                              range.goalColumn,
                              range.bidiLevel ?? undefined,
                          )
                        : range.map(changeSet),
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
