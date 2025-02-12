import {type ChangeSpec, EditorSelection, type StateCommand} from '@codemirror/state';

import {wrapToBlock} from './helpers';

export const wrapToCodeBlock: StateCommand = wrapToBlock(
    ({lineBreak}) => '```' + lineBreak,
    ({lineBreak}) => lineBreak + '```',
);

export const wrapToInlineCode: StateCommand = ({state, dispatch}) => {
    const tr = state.changeByRange((range) => {
        const content = state.sliceDoc(range.from, range.to);

        const hasBacktick = content.includes('`');
        const markup = hasBacktick ? '``' : '`';
        const before = `${markup}${content.startsWith('`') ? ' ' : ''}`;
        const after = `${content.endsWith('`') ? ' ' : ''}${markup}`;

        const changeSpec: ChangeSpec[] = [
            {from: range.from, insert: before},
            {from: range.to, insert: after},
        ];
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
                : range.map(changes),
        };
    });
    dispatch(state.update(tr));
    return true;
};
