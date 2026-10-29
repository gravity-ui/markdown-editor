import {type ChangeSpec, EditorSelection, type StateCommand} from '@codemirror/state';

import {wrapToBlock} from './helpers';
import {createInlineCommand} from './inline-formatting';
import {getInlineRanges, mapInlineRange} from './inline-ranges';

export const wrapToCodeBlock: StateCommand = wrapToBlock(
    ({lineBreak}) => '```' + lineBreak,
    ({lineBreak}) => lineBreak + '```',
);

export const toggleInlineCode: StateCommand = createInlineCommand({
    spec: {kind: 'code', before: '`', after: '`'},
    fallback: wrapInlineCodeLegacy,
});

/** @deprecated Use toggleInlineCode. */
// TODO: Remove this alias in the next major release.
export const wrapToInlineCode = toggleInlineCode;

function wrapInlineCodeLegacy({state, dispatch}: Parameters<StateCommand>[0]): boolean {
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
}
