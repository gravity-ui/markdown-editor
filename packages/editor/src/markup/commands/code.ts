import {type ChangeSpec, EditorSelection, type StateCommand} from '@codemirror/state';

import {getInlineRanges, mapInlineRange, wrapToBlock} from './helpers';

export const wrapToCodeBlock: StateCommand = wrapToBlock(
    ({lineBreak}) => '```' + lineBreak,
    ({lineBreak}) => lineBreak + '```',
);

export const wrapToInlineCode: StateCommand = ({state, dispatch}) => {
    const tr = state.changeByRange((range) => {
        const changeSpec: ChangeSpec[] = getInlineRanges(state.doc, range).flatMap(({from, to}) => {
            const content = state.sliceDoc(from, to);

            const hasBacktick = content.includes('`');
            const markup = hasBacktick ? '``' : '`';
            const before = `${markup}${content.startsWith('`') ? ' ' : ''}`;
            const after = `${content.endsWith('`') ? ' ' : ''}${markup}`;

            return [
                {from, insert: before},
                {from: to, insert: after},
            ];
        });
        const changes = state.changes(changeSpec);
        return {
            changes,
            range: range.empty
                ? EditorSelection.range(
                      range.anchor + 1,
                      range.head + 1,
                      range.goalColumn,
                      range.bidiLevel ?? undefined,
                  )
                : mapInlineRange(range, changes),
        };
    });
    dispatch(state.update(tr));
    return true;
};
