import MarkdownIt from 'markdown-it';
import {Schema} from 'prosemirror-model';
import {EditorState, TextSelection} from 'prosemirror-state';

import type {Parser} from '../core/types/parser';
import {ParserFacet} from '../core/utils/parser';

import {createMarkdownInlineMarkAction} from './actions';

const schema = new Schema({
    nodes: {
        doc: {content: 'block+'},
        paragraph: {content: 'inline*', group: 'block'},
        text: {group: 'inline'},
    },
    marks: {
        bold: {},
    },
});

const md = new MarkdownIt();
const mockParser: Parser = {
    isPunctChar: (ch: string) => md.utils.isPunctChar(ch),
    parse: () => {
        throw new Error('not implemented');
    },
    validateLink: () => true,
    normalizeLink: (url) => url,
    normalizeLinkText: (url) => url,
    matchLinks: () => null,
};
const parserPlugin = ParserFacet.of(mockParser);

const boldType = schema.marks.bold;
const action = createMarkdownInlineMarkAction(boldType);

type Segment = string | {text: string; bold: true};

/**
 * Build a state where the paragraph contains the given segments. `from`/`to`
 * are 0-based character offsets inside the paragraph text.
 */
function makeState(segments: Segment[], from: number, to: number): EditorState {
    const nodes = segments.map((seg) => {
        if (typeof seg === 'string') return schema.text(seg);
        return schema.text(seg.text, [boldType.create()]);
    });
    const doc = schema.node('doc', null, [schema.node('paragraph', null, nodes)]);
    const sel = TextSelection.create(doc, from + 1, to + 1);
    return EditorState.create({doc, selection: sel, plugins: [parserPlugin]});
}

function runAction(state: EditorState): EditorState {
    const ref = {state};
    action.run(
        ref.state,
        (tr) => {
            ref.state = ref.state.apply(tr);
        },
        undefined as never,
        undefined,
    );
    return ref.state;
}

/** Whether every text node in the doc has the bold mark. */
function allBold(state: EditorState): boolean {
    let result = true;
    state.doc.descendants((node) => {
        if (node.isText) {
            const bold = boldType.isInSet(node.marks);
            if (!bold) result = false;
        }
        return true;
    });
    return result;
}

/** Whether no text node in the doc has the bold mark. */
function noneBold(state: EditorState): boolean {
    let result = true;
    state.doc.descendants((node) => {
        if (node.isText) {
            if (boldType.isInSet(node.marks)) result = false;
        }
        return true;
    });
    return result;
}

describe('createMarkdownInlineMarkAction × removeWhenPresent:false (risk 3)', () => {
    it('B1: partial bold + bad markdown boundary → silent no-op (known limitation)', () => {
        // "hello," — selection covers the trailing comma which is a flanking issue.
        // With removeWhenPresent:false the action would try to APPLY bold to the
        // partial range; canApplyInlineMarkInMarkdown returns false for this
        // boundary; createMarkdownInlineMarkAction's guard rejects → no-op.
        // Setup: bold "hello", plain ",". Selection 5..6 (just the comma).
        const state = makeState([{text: 'hello', bold: true}, ','], 5, 6);
        const next = runAction(state);
        expect(next.doc.eq(state.doc)).toBe(true);
        // Documenting the known limitation: a user who clicks Bold on a partial
        // selection that ends on a punctuation boundary sees nothing happen.
        // Pinned here so any future fix updates this test consciously.
    });

    it('B2: range fully bold + bad boundary → action removes bold (toggle-off)', () => {
        // Same boundary, but the whole range is already bold → removal path runs,
        // which the guard explicitly allows (see actions.ts:23 comment).
        const state = makeState([{text: 'hello,', bold: true}], 5, 6);
        const next = runAction(state);
        // After toggle-off the comma node is no longer bold (and probably no node
        // in doc carries the mark over the original range).
        let commaIsBold = false;
        next.doc.nodesBetween(6, 7, (node) => {
            if (node.isText && boldType.isInSet(node.marks)) commaIsBold = true;
            return true;
        });
        expect(commaIsBold).toBe(false);
    });

    it('B3: partial bold + safe boundary → action applies bold to whole range (the fix)', () => {
        // "hello world", selection 0..11, only "hello" is bold initially.
        // Boundary is whitespace/word-edge, no flanking issue → guard passes →
        // removeWhenPresent:false makes toggleMark APPLY the mark to the whole
        // range instead of removing it.
        const state = makeState([{text: 'hello', bold: true}, ' world'], 0, 11);
        const next = runAction(state);
        expect(allBold(next)).toBe(true);
    });

    it('B3 inverse sanity: full coverage, safe boundary → toggle-off removes bold', () => {
        // Belt-and-suspenders: confirm the toggle-off path still works on the
        // happy boundary. selection covers entire bold "hello".
        const state = makeState([{text: 'hello', bold: true}], 0, 5);
        const next = runAction(state);
        expect(noneBold(next)).toBe(true);
    });
});
