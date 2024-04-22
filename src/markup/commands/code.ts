import type {ChangeSpec, StateCommand} from '@codemirror/state';

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
        const changeSpec: ChangeSpec[] = [
            {from: range.from, insert: `${markup}${content.startsWith('`') ? ' ' : ''}`},
            {from: range.to, insert: `${content.endsWith('`') ? ' ' : ''}${markup}`},
        ];
        const changes = state.changes(changeSpec);
        return {changes, range: range.map(changes)};
    });
    dispatch(state.update(tr));
    return true;
};
