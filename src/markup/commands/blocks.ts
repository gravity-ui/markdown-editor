import type {StateCommand} from '@codemirror/state';

import {replaceOrInsertAfter, wrapPerLine} from './helpers';

export const wrapToBlockquote = wrapPerLine({beforeText: '> ', skipEmptyLine: false});

export const insertBlockquoteLink: StateCommand = ({state, dispatch}) => {
    const markup = '> [link](url "title"){data-quotelink=true}\n> \n> ';
    const tr = replaceOrInsertAfter(state, markup);
    dispatch(state.update(tr));
    return true;
};
export const wrapToCheckbox = wrapPerLine({beforeText: '[ ] '});

export const insertHRule: StateCommand = ({state, dispatch}) => {
    const hrMarkup = '---';
    const tr = replaceOrInsertAfter(state, hrMarkup);
    dispatch(state.update(tr));
    return true;
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

export const insertYfmHtmlBlock: StateCommand = ({state, dispatch}) => {
    const markup = `::: html

<div>Add HTML code here</div>

:::`;

    const tr = replaceOrInsertAfter(state, markup);
    dispatch(state.update(tr));
    return true;
};
