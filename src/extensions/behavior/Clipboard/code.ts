import type {Mark} from 'prosemirror-model';
import type {EditorState} from 'prosemirror-state';

const isCodeMark = (mark: Mark) => mark.type.spec.code;

export function isInsideCode(state: EditorState): false | 'block' | 'inline' {
    if (isInsideBlockCode(state)) return 'block';
    if (isInsideInlineCode(state)) return 'inline';
    return false;
}

export function isInsideBlockCode(state: EditorState): boolean {
    // it is enough to check only $from
    // when pasting, the content is inserted into a block with the type from $from
    return Boolean(state.selection.$from.parent.type.spec.code);
}

export function isInsideInlineCode(state: EditorState): boolean {
    // same as for block code
    const fromHasCodeMark = state.selection.$from.marks().some(isCodeMark);
    if (state.selection.empty) {
        return fromHasCodeMark || (state.storedMarks ?? []).some(isCodeMark);
    }
    return fromHasCodeMark;
}
