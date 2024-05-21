import type {ChangeSpec, StateCommand} from '@codemirror/state';

import {iterateOverRangeLines, wrapPerLine} from './helpers';

export const toBulletList = wrapPerLine({beforeText: '- '});
export const toOrderedList = wrapPerLine({beforeText: '1. '});

export const sinkListItem = wrapPerLine({beforeText: '  ', skipEmptyLine: false});
export const liftListItem: StateCommand = ({state, dispatch}) => {
    const tr = state.changeByRange((range) => {
        const changeSpec: ChangeSpec[] = [];

        iterateOverRangeLines(state.doc, range, (line) => {
            if (line.text.startsWith('  '))
                changeSpec.push({from: line.from, to: line.from + 2, insert: ''});
            else if (line.text.startsWith(' '))
                changeSpec.push({from: line.from, to: line.from + 1, insert: ''});
        });

        const changes = state.changes(changeSpec);
        return {changes, range: range.map(changes)};
    });

    dispatch(state.update(tr));
    return true;
};
