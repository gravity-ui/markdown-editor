import type {Node} from 'prosemirror-model';
import {EditorState, TextSelection} from 'prosemirror-state';
import {builders} from 'prosemirror-test-builder';

import {ExtensionsManager} from '../../../core';
import {BaseNode, BaseSchema} from '../../base/BaseSchema';
import {Blockquote, blockquoteNodeName} from '../../markdown/Blockquote';
import {CodeBlockSpecs, codeBlockNodeName} from '../../markdown/CodeBlock/CodeBlockSpecs';
import {YfmTable, YfmTableNode} from '../../yfm/YfmTable';
import {GapCursorSelection} from '../Cursor/GapCursorSelection';

import {
    type Direction,
    findFakeParaPosForTextSelection,
    findNextFakeParaPosForGapCursorSelection,
    selectAll,
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
            }))
            .addNode('selectContentNode', () => ({
                spec: {content: `block+`, group: 'block', selectContent: true},
                fromMd: {tokenSpec: {name: 'selectContentNode', type: 'block', ignore: true}},
                toMd: () => {},
            })),
}).buildDeps();

const {doc, p, bq, codeBlock, table, tbody, tr, td, testnode, selectContentNode} = builders<
    | 'doc'
    | 'p'
    | 'bq'
    | 'codeBlock'
    | 'table'
    | 'tbody'
    | 'tr'
    | 'td'
    | 'testnode'
    | 'selectContentNode'
>(schema, {
    doc: {nodeType: BaseNode.Doc},
    p: {nodeType: BaseNode.Paragraph},
    bq: {nodeType: blockquoteNodeName},
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

describe('selectAll', () => {
    function createState(document: Node, from: number, to?: number) {
        return EditorState.create({
            doc: document,
            selection: TextSelection.create(document, from, to ?? from),
        });
    }

    function runSelectAll(state: EditorState): EditorState | null {
        let newState: EditorState | null = null;
        selectAll(state, (tr) => {
            newState = state.apply(tr);
        });
        return newState;
    }

    describe('code block (spec.code)', () => {
        it('should select all content inside code block when cursor is inside', () => {
            // doc: <cb>hello</cb>  positions: 0[cb]1 h e l l o 6[/cb]7
            const d = doc(codeBlock('hello'));
            const state = createState(d, 3); // cursor in the middle of "hello"
            const result = runSelectAll(state);

            expect(result).toBeTruthy();
            expect(result!.selection.from).toBe(1);
            expect(result!.selection.to).toBe(6);
        });

        it('should return false when entire code block content is already selected', () => {
            const d = doc(codeBlock('hello'));
            const state = createState(d, 1, 6); // entire content selected
            const result = runSelectAll(state);

            expect(result).toBeNull();
        });

        it('should select code block content when partial selection exists', () => {
            const d = doc(codeBlock('hello'));
            const state = createState(d, 2, 4); // partial selection "ell"
            const result = runSelectAll(state);

            expect(result).toBeTruthy();
            expect(result!.selection.from).toBe(1);
            expect(result!.selection.to).toBe(6);
        });
    });

    describe('empty content', () => {
        it('should skip empty code block', () => {
            const d = doc(codeBlock());
            const state = createState(d, 1); // cursor in empty code block
            const result = runSelectAll(state);

            expect(result).toBeNull();
        });

        it('should skip selectContent node with empty paragraph', () => {
            const d = doc(selectContentNode(p()));
            const state = createState(d, 2); // cursor in empty paragraph
            const result = runSelectAll(state);

            expect(result).toBeNull();
        });

        it('should select content of selectContent node with non-empty paragraph', () => {
            const d = doc(selectContentNode(p('text')));
            const state = createState(d, 3); // cursor in "text"
            const result = runSelectAll(state);

            expect(result).toBeTruthy();
            expect(result!.selection.from).toBe(1);
            expect(result!.selection.to).toBe(7);
        });
    });

    describe('selectContent with multiple paragraphs', () => {
        // selectContentNode(p('hello'), p('world'))
        // positions: 0[scn]1[p]2 hello 7[/p]8[p]9 world 14[/p]15[/scn]16

        it('should select all content when cursor is inside', () => {
            const d = doc(selectContentNode(p('hello'), p('world')));
            const state = createState(d, 4); // cursor in "hello"
            const result = runSelectAll(state);

            expect(result).toBeTruthy();
            expect(result!.selection.from).toBe(1);
            expect(result!.selection.to).toBe(15);
        });

        it('should fall through when all text is mouse-selected (resolved positions)', () => {
            const d = doc(selectContentNode(p('hello'), p('world')));
            // mouse selection covers from start of first paragraph text to end of last
            const state = createState(d, 2, 14);
            const result = runSelectAll(state);

            expect(result).toBeNull();
        });

        it('should fall through when content is fully selected via structural boundaries', () => {
            const d = doc(selectContentNode(p('hello'), p('world')));
            const state = createState(d, 1, 15);
            const result = runSelectAll(state);

            expect(result).toBeNull();
        });

        it('should select all content when only partial text is selected', () => {
            const d = doc(selectContentNode(p('hello'), p('world')));
            const state = createState(d, 3, 12); // partial selection
            const result = runSelectAll(state);

            expect(result).toBeTruthy();
            expect(result!.selection.from).toBe(1);
            expect(result!.selection.to).toBe(15);
        });
    });

    describe('no matching nodes', () => {
        it('should return false when cursor is in a regular paragraph', () => {
            const d = doc(p('hello'));
            const state = createState(d, 3);
            const result = runSelectAll(state);

            expect(result).toBeNull();
        });

        it('should return false when cursor is in a blockquote', () => {
            const d = doc(bq(p('hello')));
            const state = createState(d, 4);
            const result = runSelectAll(state);

            expect(result).toBeNull();
        });
    });
});
