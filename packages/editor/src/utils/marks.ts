import type {Mark, MarkType, Node} from 'prosemirror-model';
import type {EditorState} from 'prosemirror-state';

// Mirrors markdown-it's isPunctChar — covers ASCII punct + General/Supplemental Punctuation blocks
const PUNCT_RE = /[!"#$%&'()*+,\-./:;<=>?@[\\\]^_`{|}~\u2000-\u206F\u2E00-\u2E7F]/u;

function isPunct(ch: string): boolean {
    return PUNCT_RE.test(ch);
}

function isWordChar(ch: string): boolean {
    return !/\s/.test(ch) && !isPunct(ch);
}

export const findMark = (node: Node, markType: MarkType): Mark | undefined => {
    return node.marks.find((mark) => mark.type.name === markType.name);
};

export function isMarkActive(state: EditorState, type: MarkType) {
    const {from, $from, to, empty} = state.selection;

    if (empty) {
        return type.isInSet(state.storedMarks || $from.marks());
    }

    return state.doc.rangeHasMark(from, to, type);
}

/**
 * Returns `false` when the current selection cannot be wrapped in an inline mark
 * without breaking markdown round-trip, per CommonMark flanking delimiter rules:
 * https://spec.commonmark.org/0.31.2/#left-flanking-delimiter-run
 */
export function canApplyInlineMarkInMarkdown(state: EditorState): boolean {
    const {from, to, empty} = state.selection;
    if (empty) {
        return true;
    }

    const text = state.doc.textBetween(from, to);
    if (!text) {
        return true;
    }

    const chars = [...text];
    const firstChar = chars[0];
    const lastChar = chars.at(-1);

    const charBefore = from > 0 ? state.doc.textBetween(from - 1, from) : '';
    const charAfter = to < state.doc.content.size ? state.doc.textBetween(to, to + 1) : '';

    // opening delimiter would not be left-flanking
    if (isPunct(firstChar) && charBefore && isWordChar(charBefore)) {
        return false;
    }

    // closing delimiter would not be right-flanking
    return !(lastChar && isPunct(lastChar) && charAfter && isWordChar(charAfter));
}
