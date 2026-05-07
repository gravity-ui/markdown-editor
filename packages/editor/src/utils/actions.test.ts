import MarkdownIt from 'markdown-it';
import {Schema} from 'prosemirror-model';
import {EditorState, TextSelection} from 'prosemirror-state';

import type {Parser} from '../core/types/parser';
import {ParserFacet} from '../core/utils/parser';

import {createMarkdownInlineMarkAction, createMarkdownInlineMarkCommand} from './actions';

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

const boldType = schema.marks.bold;
const parserPlugin = ParserFacet.of(mockParser);
const action = createMarkdownInlineMarkAction(boldType);
const command = createMarkdownInlineMarkCommand(boldType);

type Segment = string | {text: string; bold: true};

function makeState(segments: Segment[], from: number, to: number): EditorState {
    const nodes = segments.map((segment) =>
        typeof segment === 'string'
            ? schema.text(segment)
            : schema.text(segment.text, [boldType.create()]),
    );
    const doc = schema.node('doc', null, [schema.node('paragraph', null, nodes)]);
    const selection = TextSelection.create(doc, from + 1, to + 1);
    return EditorState.create({doc, selection, plugins: [parserPlugin]});
}

function runAction(state: EditorState) {
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

function runCommand(state: EditorState) {
    const ref = {state};
    const handled = command(
        ref.state,
        (tr) => {
            ref.state = ref.state.apply(tr);
        },
        undefined as never,
    );

    return {handled, state: ref.state};
}

function everyTextNodeHasBold(state: EditorState) {
    let allBold = true;
    state.doc.descendants((node) => {
        if (node.isText && !boldType.isInSet(node.marks)) {
            allBold = false;
        }
        return true;
    });
    return allBold;
}

function noTextNodeHasBold(state: EditorState) {
    let hasBold = false;
    state.doc.descendants((node) => {
        if (node.isText && boldType.isInSet(node.marks)) {
            hasBold = true;
        }
        return true;
    });
    return !hasBold;
}

describe('createMarkdownInlineMarkAction', () => {
    it('applies the mark to the whole mixed selection', () => {
        const state = makeState([{text: 'hello', bold: true}, ' world'], 0, 11);
        const next = runAction(state);

        expect(everyTextNodeHasBold(next)).toBe(true);
    });

    it('removes the mark from a fully covered selection', () => {
        const state = makeState([{text: 'hello', bold: true}], 0, 5);
        const next = runAction(state);

        expect(noTextNodeHasBold(next)).toBe(true);
    });

    it('blocks apply on invalid markdown boundaries but still allows removal', () => {
        const blocked = makeState([{text: 'hello', bold: true}, ','], 5, 6);
        expect(runAction(blocked).doc.eq(blocked.doc)).toBe(true);

        const removable = makeState([{text: 'hello,', bold: true}], 5, 6);
        expect(noTextNodeHasBold(runAction(removable))).toBe(true);
    });
});

describe('createMarkdownInlineMarkCommand', () => {
    it('matches the action behavior on mixed selections', () => {
        const state = makeState([{text: 'hello', bold: true}, ' world'], 0, 11);
        const next = runCommand(state);

        expect(next.handled).toBe(true);
        expect(everyTextNodeHasBold(next.state)).toBe(true);
    });

    it('is blocked by the same markdown boundary guard', () => {
        const state = makeState([{text: 'hello', bold: true}, ','], 5, 6);
        const next = runCommand(state);

        expect(next.handled).toBe(false);
        expect(next.state.doc.eq(state.doc)).toBe(true);
    });
});
