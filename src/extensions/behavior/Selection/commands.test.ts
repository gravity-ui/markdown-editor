import type {Node} from 'prosemirror-model';
import {TextSelection} from 'prosemirror-state';
import {builders} from 'prosemirror-test-builder';

import {ExtensionsManager} from '../../../core';
import {BaseNode, BaseSchema} from '../../base/BaseSchema';
import {Blockquote, blockquote} from '../../markdown/Blockquote';
import {CodeBlockSpecs, codeBlockNodeName} from '../../markdown/CodeBlock/CodeBlockSpecs';
import {YfmTable, YfmTableNode} from '../../yfm/YfmTable';
import {GapCursorSelection} from '../Cursor/GapCursorSelection';

import {
    Direction,
    findFakeParaPosForTextSelection,
    findNextFakeParaPosForGapCursorSelection,
} from './commands';

const {schema} = new ExtensionsManager({
    extensions: (builder) =>
        builder
            .use(BaseSchema, {})
            .use(Blockquote, {})
            .use(CodeBlockSpecs, {})
            .use(YfmTable, {})
            .addNode('testnode', () => ({
                spec: {content: `block*`, group: 'block', gapcursor: false},
                fromMd: {tokenSpec: {name: 'testnode', type: 'block', ignore: true}},
                toMd: () => {},
            })),
}).buildDeps();

const {doc, p, bq, codeBlock, table, tbody, tr, td, testnode} = builders<
    'doc' | 'p' | 'bq' | 'codeBlock' | 'table' | 'tbody' | 'tr' | 'td' | 'testnode'
>(schema, {
    doc: {nodeType: BaseNode.Doc},
    p: {nodeType: BaseNode.Paragraph},
    bq: {nodeType: blockquote},
    codeBlock: {nodeType: codeBlockNodeName},
    table: {nodeType: YfmTableNode.Table},
    tbody: {nodeType: YfmTableNode.Body},
    tr: {nodeType: YfmTableNode.Row},
    td: {nodeType: YfmTableNode.Cell},
});

function shouldFindPos(doc: Node, dir: Direction, selPos: number, fakePos: number) {
    const sel = TextSelection.create(doc, selPos);
    const $pos = findFakeParaPosForTextSelection(sel, dir);

    expect($pos).toBeTruthy();
    expect($pos!.pos).toBe(fakePos);
}

function shouldReturnNull(doc: Node, dir: Direction, selPos: number) {
    const sel = TextSelection.create(doc, selPos);
    const $pos = findFakeParaPosForTextSelection(sel, dir);

    expect($pos).toBeNull();
}

function shouldFindNextPos(doc: Node, dir: Direction, selPos: number, fakePos: number) {
    const sel = new GapCursorSelection(doc.resolve(selPos));
    const $pos = findNextFakeParaPosForGapCursorSelection(sel, dir);

    expect($pos).toBeTruthy();
    expect($pos!.pos).toBe(fakePos);
}

function shouldNotFindNextPos(doc: Node, dir: Direction, selPos: number) {
    const sel = new GapCursorSelection(doc.resolve(selPos));
    const $pos = findNextFakeParaPosForGapCursorSelection(sel, dir);

    expect($pos).toBeNull();
}

describe('Selection arrow commands: findFakeParaPosForTextSelection', () => {
    it.each(['before', 'after'] as const)(
        'should not find fake paragraph position %s empty paragraph in doc',
        (dir) => {
            shouldReturnNull(doc(p()), dir, 1);
        },
    );

    it.each(['before', 'after'] as const)(
        'should not find fake paragraph position %s empty paragraph [2]',
        (dir) => {
            shouldReturnNull(doc(p(), p(), p()), dir, 3); // cursor in second paragraph
        },
    );

    describe('codeblock', () => {
        it.each([
            ['before', 0],
            ['after', 2],
        ] as const)('should find fake paragraph position %s codeblock', (dir, fakePos) => {
            shouldFindPos(doc(codeBlock()), dir, 1, fakePos);
        });

        it.each(['before', 'after'] as const)(
            'should not find fake paragraph position %s codeblock ',
            (dir) => {
                shouldReturnNull(doc(p(), codeBlock(), p()), dir, 3); // cursor in codeblock
            },
        );

        it.each([
            ['before', 3, 2],
            ['after', 1, 2],
        ] as const)(
            'should find fake paragraph position between code blocks [%s]',
            (dir, selPos, fakePos) => {
                shouldFindPos(doc(codeBlock(), codeBlock()), dir, selPos, fakePos);
            },
        );
    });

    it.each([
        ['before', 0],
        ['after', 4],
    ] as const)('should find fake paragraph position %s block (blockquote)', (dir, fakePos) => {
        shouldFindPos(doc(bq(p())), dir, 2, fakePos); // cursor in para in blockquote
    });

    it.each([
        ['before', 6, 4],
        ['after', 2, 4],
    ] as const)(
        'should find fake paragraph position between blocks (blockquotes) [%s]',
        (dir, selPos, fakePos) => {
            shouldFindPos(doc(bq(p()), bq(p())), dir, selPos, fakePos);
        },
    );

    it.each([
        ['before', 4], // cursor in second para
        ['after', 2], // cursor in first para
    ] as const)(
        'should not find fake paragraph position beetween paragraphs in block (in blockquote) [%s]',
        (dir, selPos) => {
            shouldReturnNull(doc(bq(p(), p())), dir, selPos);
        },
    );

    it.each([
        ['before', 9, 4],
        ['after', 31, 36],
    ] as const)(
        'should find fake paragraph position on edge of complex block (yfm-table) [%s]',
        (dir, selPos, fakePos) => {
            shouldFindPos(
                doc(
                    bq(p()),
                    table(tbody(tr(td(p()), td(p()), td(p())), tr(td(p()), td(p()), td(p())))),
                    bq(p()),
                ),
                dir,
                selPos,
                fakePos,
            );
        },
    );

    it.each([
        ['before', 19],
        ['after', 5],
    ] as const)(
        'should not find fake paragraph position inside of complex block (yfm-table) [%s]',
        (dir, selPos) => {
            shouldReturnNull(
                doc(table(tbody(tr(td(p()), td(p()), td(p())), tr(td(p()), td(p()), td(p()))))),
                dir,
                selPos,
            );
        },
    );

    it.each([
        ['before', 7],
        ['after', 29],
    ] as const)(
        'should not find fake paragraph position on edge of complex block (yfm-table) with textblock [%s]',
        (dir, selPos) => {
            shouldReturnNull(
                doc(
                    p(),
                    table(tbody(tr(td(p()), td(p()), td(p())), tr(td(p()), td(p()), td(p())))),
                    p(),
                ),
                dir,
                selPos,
            );
        },
    );

    describe('gapcursor: false', () => {
        it.each([
            ['before', 3, 0],
            ['after', 3, 6],
        ] as const)(
            'should skip nodes with `gapcursor: false` flag [%s] (1)',
            (dir, selPos, fakePos) => {
                shouldFindPos(doc(testnode(bq(p()))), dir, selPos, fakePos);
            },
        );

        it.each([
            ['before', 7],
            ['after', 3],
        ] as const)('should skip nodes with `gapcursor: false` flag [%s] (2)', (dir, selPos) => {
            shouldReturnNull(doc(testnode(bq(p()), bq(p()))), dir, selPos);
        });
    });

    describe('pyramid of quotes', () => {
        const initDoc = doc(bq(p('1'), bq(p('3')), p('2')));

        it.each([
            ['before', 6], // before '3'
            ['after', 6], // before '3'
        ] as const)('should ignore – top level', (dir, selPos) => {
            shouldReturnNull(initDoc, dir, selPos);
        });

        it.each([
            ['before', 2, 0], // after '1'
            ['after', 10, 13], // after '2'
        ] as const)('should find a position %s the base of the pyramid', (dir, selPos, fakePos) => {
            shouldFindPos(initDoc, dir, selPos, fakePos);
        });
    });

    describe('stack of quotes', () => {
        const initDoc = doc(bq(bq(p('1'))));

        it.each([
            ['before', 1], // before nested quote
            ['after', 6], // after nested quote
        ] as const)('should find a position %s nested quote', (dir, fakePos) => {
            shouldFindPos(initDoc, dir, 3, fakePos);
        });

        it.each([
            ['before', 1, 0],
            ['after', 6, 7],
        ] as const)('should find next fake para position %s root quote', (dir, selPos, fakePos) => {
            shouldFindNextPos(initDoc, dir, selPos, fakePos);
        });
    });

    it.each(['before', 'after'] as const)(
        'should not find next fake para pos if current fake pos located between two blocks [%s]',
        (dir) => {
            shouldNotFindNextPos(doc(bq(bq(p()), bq(p()))), dir, 5);
        },
    );
});
