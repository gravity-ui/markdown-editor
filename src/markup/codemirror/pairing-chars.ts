import {ChangeSet, ChangeSpec} from '@codemirror/state';
import {EditorView} from '@codemirror/view';

const PAIRING_CHARS = new Map([
    ['(', ')'],
    ['{', '}'],
    ['[', ']'],
    ['<', '>'],

    ['*', '*'],
    ['~', '~'],

    ['"', '"'],
    ["'", "'"],
    ['`', '`'],
]);

export const PairingCharactersExtension = EditorView.inputHandler.of((view, _1, _2, text) => {
    if (!PAIRING_CHARS.has(text)) return false;

    const tr = view.state.changeByRange((range) => {
        const changes: ChangeSpec[] = [{from: range.from, insert: text}];
        if (!range.empty) changes.push({from: range.to, insert: PAIRING_CHARS.get(text)});

        const changeSet = ChangeSet.of(changes, view.state.doc.length);

        return {changes: changeSet, range: range.map(changeSet, range.empty ? 1 : 0)};
    });

    view.dispatch(tr, {scrollIntoView: true});

    return true;
});
