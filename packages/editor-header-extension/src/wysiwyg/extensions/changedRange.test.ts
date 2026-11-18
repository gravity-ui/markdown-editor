// @vitest-environment jsdom
import {EditorState, type Transaction} from '@gravity-ui/markdown-editor/pm/state';
import {BoldSpecs, boldMarkName} from '@gravity-ui/markdown-editor/specs';
import {describe, expect, it} from 'vitest';

import {createTestEditor, header, headerExtensions, title} from '../../../tests/editor';

import {changedRange, coveringRanges} from './changedRange';

const {markupParser, schema} = createTestEditor(
    headerExtensions((builder) => builder.use(BoldSpecs)),
);
const bold = () => schema.marks[boldMarkName].create();

const initialState = (markup = 'Alpha\n\nBravo\n\nCharlie') =>
    EditorState.create({schema, doc: markupParser.parse(markup)});

const transaction = (markup?: string) => initialState(markup).tr;

describe('Changed range of a transaction', () => {
    it.each<[string, (tr: Transaction) => Transaction, [number, number], [number, number]]>([
        ['typed text', (tr) => tr.insertText('X', 3), [3, 3], [3, 4]],
        ['deleted text', (tr) => tr.delete(8, 13), [8, 13], [8, 8]],
        ['replaced text', (tr) => tr.insertText('Echo', 8, 13), [8, 13], [8, 12]],
        [
            'insert after a later delete',
            (tr) => tr.insertText('ZZ', 15).delete(1, 6),
            [1, 15],
            [1, 12],
        ],
        [
            'delete before an earlier insert',
            (tr) => tr.delete(15, 22).insertText('Q', 1),
            [1, 22],
            [1, 16],
        ],
        [
            'edit inside an earlier insert',
            (tr) => tr.insertText('QQ', 1).insertText('W', 2),
            [1, 1],
            [1, 4],
        ],
        ['split paragraph', (tr) => tr.split(10), [10, 10], [10, 12]],
        ['joined paragraphs', (tr) => tr.join(7), [6, 8], [6, 6]],
        ['an added mark', (tr) => tr.addMark(2, 5, bold()), [2, 5], [2, 5]],
        [
            'a removed mark after a later insert',
            (tr) => tr.addMark(8, 13, bold()).insertText('QQ', 1).removeMark(10, 15),
            [1, 13],
            [1, 15],
        ],
    ])('should cover the changes of a transaction with %s', (_name, change, before, after) => {
        const tr = change(transaction());
        const range = {before: changedRange(tr, 'before'), after: changedRange(tr, 'after')};
        expect(range).toEqual({
            before: {from: before[0], to: before[1]},
            after: {from: after[0], to: after[1]},
        });
        expect(tr.doc.content.cut(0, after[0]).eq(tr.before.content.cut(0, before[0]))).toBe(true);
        expect(tr.doc.content.cut(after[1]).eq(tr.before.content.cut(before[1]))).toBe(true);
    });

    it.each<[string, (tr: Transaction) => Transaction, number]>([
        ['no steps', (tr) => tr, 0],
        ['only an attribute', (tr) => tr.setNodeAttribute(0, 'align', 'center'), 1],
    ])('should return no range for a transaction with %s', (_name, change, steps) => {
        const tr = change(transaction(header(title)));
        expect(tr.steps).toHaveLength(steps);
        expect([changedRange(tr, 'before'), changedRange(tr, 'after')]).toEqual([null, null]);
    });
});

describe('Covering ranges of transactions', () => {
    type Change = (state: EditorState) => Transaction;
    type Ranges = [number, number][];

    const skipped = 'skipped';

    it.each<[string, Change[], Ranges]>([
        ['a single insert', [(state) => state.tr.insertText('X', 3)], [[3, 4]]],
        ['a deletion', [(state) => state.tr.delete(8, 13)], []],
        [
            'an insert mapped through a later step of its transaction',
            [(state) => state.tr.insertText('X', 15).insertText('QQ', 1)],
            [[1, 18]],
        ],
        [
            'an insert followed by a transaction that inserts before it',
            [(state) => state.tr.insertText('X', 8), (state) => state.tr.insertText('QQ', 1)],
            [
                [10, 11],
                [1, 3],
            ],
        ],
        [
            'an insert deleted by a later transaction',
            [(state) => state.tr.insertText('X', 8), (state) => state.tr.delete(7, 15)],
            [],
        ],
        [
            'a transaction skipped by the filter',
            [
                (state) => state.tr.insertText('X', 3).setMeta(skipped, true),
                (state) => state.tr.insertText('Y', 10),
            ],
            [[10, 11]],
        ],
        ['an added mark', [(state) => state.tr.addMark(8, 13, bold())], [[8, 13]]],
        [
            'marks added to two paragraphs',
            [(state) => state.tr.addMark(1, 6, bold()).addMark(15, 22, bold())],
            [[1, 22]],
        ],
    ])('should return the covering ranges of %s', (_name, changes, covering) => {
        let state = initialState();
        const trs = changes.map((change) => {
            const tr = change(state);
            state = state.apply(tr);
            return tr;
        });
        const pick = (tr: Transaction) => !tr.getMeta(skipped);
        const ranges = (expected: Ranges) => expected.map(([from, to]) => ({from, to}));
        expect(coveringRanges(trs, pick)).toEqual(ranges(covering));
    });
});
