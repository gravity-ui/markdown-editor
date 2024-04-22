import type {ChangeSpec, StateCommand} from '@codemirror/state';

import {getBlockExtraLineBreaks, wrapToBlock} from './helpers';

export const wrapToYfmCut: StateCommand = wrapToBlock(
    ({lineBreak}) => '{% cut "title" %}' + lineBreak.repeat(2),
    ({lineBreak}) => lineBreak.repeat(2) + '{% endcut %}',
);

export const wrapToYfmNote = wrapToBlock(
    ({lineBreak}) => '{% note info %}' + lineBreak.repeat(2),
    ({lineBreak}) => lineBreak.repeat(2) + '{% endnote %}',
);

// todo: remove
export const wrapToYfmBlock = wrapToBlock(
    ({lineBreak}) => '{% block %}' + lineBreak.repeat(2),
    ({lineBreak}) => lineBreak.repeat(2) + '{% endblock %}',
);

// todo: remove
export const wrapToYfmLayout = wrapToBlock(
    ({lineBreak}) =>
        '{% layout gap=l %}' + lineBreak.repeat(2) + '{% block %}' + lineBreak.repeat(2),
    ({lineBreak}) =>
        lineBreak.repeat(2) + '{% endblock %}' + lineBreak.repeat(2) + '{% endlayout %}',
);

export const insertYfmTabs: StateCommand = ({state, dispatch}) => {
    const selrange = state.selection.main;
    const fromLine = state.doc.lineAt(selrange.from);
    const toLine = state.doc.lineAt(selrange.to);

    const extraBreaks = getBlockExtraLineBreaks(state, {from: fromLine, to: toLine});

    const changeSpec: ChangeSpec[] = [];

    changeSpec.push({
        from: toLine.to,
        insert: state.lineBreak + '{% endlist %}' + state.lineBreak.repeat(extraBreaks.after),
    });

    for (let i = toLine.number; i >= fromLine.number; i--) {
        const line = state.doc.line(i);
        changeSpec.push({from: line.from, insert: '  '});
    }

    changeSpec.push({
        from: fromLine.from,
        insert:
            state.lineBreak.repeat(extraBreaks.before) +
            '{% list tabs %}' +
            state.lineBreak.repeat(2) +
            '- Tab name' +
            state.lineBreak.repeat(2),
    });

    const changes = state.changes(changeSpec);
    dispatch(
        state.update({
            changes,
            selection: state.selection.replaceRange(
                selrange.map(changes),
                state.selection.mainIndex,
            ),
        }),
    );

    return true;
};

export const insertYfmTable: StateCommand = ({state, dispatch}) => {
    const tableTokens = ['#|', '||', '', '|', '', '||', '||', '', '|', '', '||', '|#', ''].join(
        state.lineBreak.repeat(2),
    );

    const changeSpec: ChangeSpec[] = [];

    const selrange = state.selection.main;

    const toLine = state.doc.lineAt(selrange.to);
    if (selrange.empty && toLine.length === 0) {
        const extraBreaks = getBlockExtraLineBreaks(state, {from: toLine, to: toLine});
        changeSpec.push({
            from: toLine.from,
            to: toLine.to,
            insert:
                state.lineBreak.repeat(extraBreaks.before) +
                tableTokens +
                state.lineBreak.repeat(extraBreaks.after),
        });
    } else {
        changeSpec.push({
            from: toLine.to,
            insert: state.lineBreak.repeat(2) + tableTokens + state.lineBreak.repeat(2),
        });
    }

    const changes = state.changes(changeSpec);
    dispatch(state.update({changes, selection: state.selection.map(changes)}));
    return true;
};
