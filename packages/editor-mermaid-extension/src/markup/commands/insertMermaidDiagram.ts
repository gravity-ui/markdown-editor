import {MarkupHelpers} from '@gravity-ui/markdown-editor';
import type {StateCommand} from '@gravity-ui/markdown-editor/cm/state';

export const insertMermaidDiagram: StateCommand = ({state, dispatch}) => {
    const markup = `\`\`\`mermaid
sequenceDiagram
    Alice->>Bob: Hi Bob
    Bob->>Alice: Hi Alice
\`\`\``;

    const tr = MarkupHelpers.replaceOrInsertAfter(state, markup);
    dispatch(state.update(tr));
    return true;
};
