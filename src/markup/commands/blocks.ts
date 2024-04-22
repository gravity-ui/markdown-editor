import type {ChangeSpec, StateCommand} from '@codemirror/state';

import {replaceOrInsertAfter, wrapPerLine} from './helpers';

export const toBlockquote = wrapPerLine({beforeText: '> ', skipEmptyLine: false});
export const toCheckbox = wrapPerLine({beforeText: '[ ] '});

export const insertHRule: StateCommand = ({state, dispatch}) => {
    const hrMarkup = '---';
    const {lineBreak} = state;
    const trSpec = state.changeByRange((range) => {
        const {anchor} = range;
        if (range.empty && state.doc.lineAt(anchor).length === 0) {
            const currLine = state.doc.lineAt(anchor);
            const changes: ChangeSpec[] = [];
            if (currLine.number > 1 && state.doc.line(currLine.number - 1).length !== 0) {
                changes.push({from: anchor - 1, insert: lineBreak});
            }
            if (
                state.doc.lines > currLine.number &&
                state.doc.line(currLine.number - 1).length !== 0
            ) {
                changes.push({from: anchor, insert: lineBreak});
            }
            changes.push({from: anchor, insert: hrMarkup});
            return {changes, range: range.map(state.changes(changes))};
        }

        const toLine = state.doc.lineAt(range.to);
        const nextLineIsEmpty =
            state.doc.lines > toLine.number && state.doc.line(toLine.number + 1).length === 0;
        const changes = state.changes([
            {
                from: toLine.to,
                insert: lineBreak + lineBreak + hrMarkup + (nextLineIsEmpty ? '' : lineBreak),
            },
        ]);
        return {changes, range: range.map(changes)};
    });
    dispatch(state.update(trSpec));
    return true;
};

// TODO: remove
export const insertIframe = (args: {
    src: string;
    width?: number;
    height?: number;
}): StateCommand => {
    return ({state, dispatch}) => {
        const argsMarkup = Object.entries(args)
            .map(([k, v]) => `${k}=${v}`)
            .join(' ');
        const markup = `/iframe/(${argsMarkup})`;

        const tr = replaceOrInsertAfter(state, markup);
        dispatch(state.update(tr));
        return true;
    };
};

export const insertMermaidDiagram: StateCommand = ({state, dispatch}) => {
    const markup = `\`\`\`mermaid
sequenceDiagram
    Alice->>Bob: Hi Bob
    Bob->>Alice: Hi Alice
\`\`\``;

    const tr = replaceOrInsertAfter(state, markup);
    dispatch(state.update(tr));
    return true;
};
