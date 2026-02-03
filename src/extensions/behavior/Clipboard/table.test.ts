import {TextSelection} from 'prosemirror-state';
import {builders} from 'prosemirror-test-builder';

import {ExtensionsManager} from '../../../core';
import {MathNode, MathSpecs} from '../../additional/Math/MathSpecs';
import {BaseNode, BaseSchemaSpecs} from '../../base/BaseSchema/BaseSchemaSpecs';
import {TableNode, TableSpecs} from '../../markdown/Table/TableSpecs';
import {YfmTableNode, YfmTableSpecs} from '../../yfm/YfmTable/YfmTableSpecs';

import {trimEmptyTableCells, trimTableEdgeCell} from './table';

// Build schema tables
function buildDeps() {
    return new ExtensionsManager({
        extensions: (builder) => {
            builder.use(BaseSchemaSpecs, {}).use(TableSpecs).use(YfmTableSpecs, {}).use(MathSpecs);
        },
    }).buildDeps();
}

const {schema} = buildDeps();

// Builders for tables
const {doc, p, table, thead, tbody, tr, th, td, yfmTable, yfmTbody, yfmTr, yfmTd, mathInline} =
    builders<
        | 'doc'
        | 'p'
        | 'table'
        | 'thead'
        | 'tbody'
        | 'tr'
        | 'th'
        | 'td'
        | 'yfmTable'
        | 'yfmTbody'
        | 'yfmTr'
        | 'yfmTd'
        | 'mathInline'
    >(schema, {
        doc: {nodeType: BaseNode.Doc},
        p: {nodeType: BaseNode.Paragraph},
        table: {nodeType: TableNode.Table},
        thead: {nodeType: TableNode.Head},
        tbody: {nodeType: TableNode.Body},
        tr: {nodeType: TableNode.Row},
        th: {nodeType: TableNode.HeaderCell},
        td: {nodeType: TableNode.DataCell},
        yfmTable: {nodeType: YfmTableNode.Table},
        yfmTbody: {nodeType: YfmTableNode.Body},
        yfmTr: {nodeType: YfmTableNode.Row},
        yfmTd: {nodeType: YfmTableNode.Cell},
        mathInline: {nodeType: MathNode.Inline},
    });

describe('trimTableEdgeCell', () => {
    describe('Single-line tables (TableSpecs)', () => {
        describe('forward direction', () => {
            it('should NOT move position out of first cell when cursor at start', () => {
                const node = doc(
                    table(thead(tr(th('head1'), th('head2'))), tbody(tr(td('text1'), td('text2')))),
                );
                const pos = 22; // Start of 'text1' in first cell of tbody
                const $pos = node.resolve(pos);
                const result = trimTableEdgeCell($pos, 'forward');

                // Should NOT move out of the first cell
                expect(result).toBe(pos);
            });

            it('should move to next cell when cursor at end of middle cell', () => {
                const node = doc(
                    table(
                        thead(tr(th('head1'), th('head2'), th('head3'))),
                        tbody(tr(td('text1'), td('text2'), td('text3'))),
                    ),
                );
                const pos = 41; // End of 'text2' in middle cell
                const $pos = node.resolve(pos);
                const result = trimTableEdgeCell($pos, 'forward');

                // Should move to start of next cell (text3)
                expect(result).toBeGreaterThan(pos);
                const $result = node.resolve(result);
                expect($result.parent.textContent).toBe('text3');
                expect(result).toBe(43);
            });

            it('should move to first cell of next row when cursor at end of last cell in row', () => {
                const node = doc(
                    table(
                        thead(tr(th('head1'), th('head2'))),
                        tbody(tr(td('text1'), td('text2')), tr(td('text3'), td('text4'))),
                    ),
                );
                const pos = 34; // End of 'text2' in last cell of first row of tbody
                const $pos = node.resolve(pos);
                const result = trimTableEdgeCell($pos, 'forward');

                // Should move to start of first cell in next row (text3)
                expect(result).toBeGreaterThan(pos);
                const $result = node.resolve(result);
                expect($result.parent.textContent).toBe('text3');
                expect(result).toBe(38);
            });

            it('should exit table when cursor at end of last cell in table', () => {
                const node = doc(
                    p('before'),
                    table(thead(tr(th('head1'), th('head2'))), tbody(tr(td('text1'), td('text2')))),
                    p('after'),
                );
                const pos = 42; // End of 'text2' in last cell
                const $pos = node.resolve(pos);
                const result = trimTableEdgeCell($pos, 'forward');

                // Should exit table and be in the paragraph after
                expect(result).toBeGreaterThan(pos);
                const $result = node.resolve(result);
                expect($result.parent.type.name).toBe(BaseNode.Paragraph);
                expect($result.parent.textContent).toBe('after');
                expect(result).toBe(47);
            });

            it('should move to first cell in tbody when cursor at end of last cell in thead', () => {
                const node = doc(
                    table(thead(tr(th('head1'), th('head2'))), tbody(tr(td('text1'), td('text2')))),
                );
                const pos = 16; // End of 'head2' in thead
                const $pos = node.resolve(pos);
                const result = trimTableEdgeCell($pos, 'forward');

                // Should move to start of first cell in tbody (text1)
                expect(result).toBeGreaterThan(pos);
                const $result = node.resolve(result);
                expect($result.parent.textContent).toBe('text1');
                expect(result).toBe(22);
            });

            it('should NOT change position when cursor in middle of text (not at end)', () => {
                const node = doc(
                    table(thead(tr(th('head1'), th('head2'))), tbody(tr(td('text1'), td('text2')))),
                );
                const pos = 24; // Middle of 'text1' (te|xt1)
                const $pos = node.resolve(pos);
                const result = trimTableEdgeCell($pos, 'forward');

                // Position should not change
                expect(result).toBe(pos);
            });

            it('should move to start of next cell when first cell is empty', () => {
                const node = doc(
                    table(thead(tr(th('head1'), th('head2'))), tbody(tr(td(''), td('text2')))),
                );
                const pos = 22; // Empty first cell of tbody
                const $pos = node.resolve(pos);
                const result = trimTableEdgeCell($pos, 'forward');

                // Should move to start of next cell (text2)
                expect(result).toBeGreaterThan(pos);
                const $result = node.resolve(result);
                expect($result.parent.textContent).toBe('text2');
                expect(result).toBe(24);
            });

            it('should move to next cell when cursor at end of inline formula (last element in cell)', () => {
                const node = doc(
                    table(
                        thead(tr(th('head1'), th('head2'))),
                        tbody(tr(td('text', mathInline('x^2')), td('next'))),
                    ),
                );
                // Position at end of 'x^2' inside mathInline (last char of formula)
                const pos = 30; // End of 'x^2' in mathInline
                const $pos = node.resolve(pos);
                const result = trimTableEdgeCell($pos, 'forward');

                // Should move to next cell - cursor at end of last inline block
                expect(result).toBeGreaterThan(pos);
                const $result = node.resolve(result);
                expect($result.parent.textContent).toBe('next');
                expect(result).toBe(33);
            });
        });

        describe('backward direction', () => {
            it('should NOT move position out of cell when cursor not at start', () => {
                const node = doc(
                    table(thead(tr(th('head1'), th('head2'))), tbody(tr(td('text1'), td('text2')))),
                );
                const pos = 34; // End of 'text2' in last cell
                const $pos = node.resolve(pos);
                const result = trimTableEdgeCell($pos, 'backward');

                // Should not move
                expect(result).toBe(pos);
            });

            it('should move to end of previous cell when cursor at start of middle cell', () => {
                const node = doc(
                    table(
                        thead(tr(th('head1'), th('head2'), th('head3'))),
                        tbody(tr(td('text1'), td('text2'), td('text3'))),
                    ),
                );
                const pos = 36; // Start of 'text2' in middle cell
                const $pos = node.resolve(pos);
                const result = trimTableEdgeCell($pos, 'backward');

                // Should move to end of previous cell (text1)
                expect(result).toBeLessThan(pos);
                const $result = node.resolve(result);
                expect($result.parent.textContent).toBe('text1');
                expect(result).toBe(34);
            });

            it('should move to end of last cell in previous row when cursor at start of first cell in row', () => {
                const node = doc(
                    table(
                        thead(tr(th('head1'), th('head2'))),
                        tbody(tr(td('text1'), td('text2')), tr(td('text3'), td('text4'))),
                    ),
                );
                const pos = 38; // Start of 'text3' in first cell of second row
                const $pos = node.resolve(pos);
                const result = trimTableEdgeCell($pos, 'backward');

                // Should move to end of last cell in previous row (text2)
                expect(result).toBeLessThan(pos);
                const $result = node.resolve(result);
                expect($result.parent.textContent).toBe('text2');
                expect(result).toBe(34);
            });

            it('should exit table when cursor at start of first cell in table', () => {
                const node = doc(
                    p('before'),
                    table(thead(tr(th('head1'), th('head2'))), tbody(tr(td('text1'), td('text2')))),
                    p('after'),
                );
                const pos = 12; // Start of 'head1' in first cell
                const $pos = node.resolve(pos);
                const result = trimTableEdgeCell($pos, 'backward');

                // Should exit table and be in the paragraph before
                expect(result).toBeLessThan(pos);
                const $result = node.resolve(result);
                expect($result.parent.type.name).toBe(BaseNode.Paragraph);
                expect($result.parent.textContent).toBe('before');
                expect(result).toBe(7);
            });

            it('should move to end of last cell in thead when cursor at start of first cell in tbody', () => {
                const node = doc(
                    table(thead(tr(th('head1'), th('head2'))), tbody(tr(td('text1'), td('text2')))),
                );
                const pos = 22; // Start of 'text1' in first cell of tbody
                const $pos = node.resolve(pos);
                const result = trimTableEdgeCell($pos, 'backward');

                // Should move to end of last cell in thead (head2)
                expect(result).toBeLessThan(pos);
                const $result = node.resolve(result);
                expect($result.parent.textContent).toBe('head2');
                expect(result).toBe(16);
            });

            it('should NOT change position when cursor in middle of text (not at start)', () => {
                const node = doc(
                    table(thead(tr(th('head1'), th('head2'))), tbody(tr(td('text1'), td('text2')))),
                );
                const pos = 31; // Middle of 'text2' (te|xt2)
                const $pos = node.resolve(pos);
                const result = trimTableEdgeCell($pos, 'backward');

                // Position should not change
                expect(result).toBe(pos);
            });

            it('should move to end of previous cell when last cell is empty', () => {
                const node = doc(
                    table(thead(tr(th('head1'), th('head2'))), tbody(tr(td('text1'), td('')))),
                );
                const pos = 29; // Empty last cell
                const $pos = node.resolve(pos);
                const result = trimTableEdgeCell($pos, 'backward');

                // Should move to end of previous cell (text1)
                expect(result).toBeLessThan(pos);
                const $result = node.resolve(result);
                expect($result.parent.textContent).toBe('text1');
                expect(result).toBe(27);
            });

            it('should move to previous cell when cursor at start of inline formula (first element in cell)', () => {
                const node = doc(
                    table(
                        thead(tr(th('head1'), th('head2'))),
                        tbody(tr(td('prev'), td(mathInline('x^2'), 'text'))),
                    ),
                );
                // Position at start of 'x^2' inside mathInline (first char of formula)
                const pos = 29; // Start of 'x^2' in mathInline
                const $pos = node.resolve(pos);
                const result = trimTableEdgeCell($pos, 'backward');

                // Should move to previous cell - cursor at start of first inline block
                expect(result).toBeLessThan(pos);
                const $result = node.resolve(result);
                expect($result.parent.textContent).toBe('prev');
                expect(result).toBe(26);
            });
        });
    });

    describe('Multi-line tables (YfmTableSpecs)', () => {
        describe('forward direction', () => {
            it('should NOT move position out of cell when cursor at start of paragraph', () => {
                const node = doc(yfmTable(yfmTbody(yfmTr(yfmTd(p('text1')), yfmTd(p('text2'))))));
                const pos = 5; // Start of 'text1' in first cell
                const $pos = node.resolve(pos);
                const result = trimTableEdgeCell($pos, 'forward');

                // Should not move
                expect(result).toBe(pos);
            });

            it('should move to next cell when cursor at end of paragraph in middle cell', () => {
                const node = doc(
                    yfmTable(
                        yfmTbody(yfmTr(yfmTd(p('text1')), yfmTd(p('text2')), yfmTd(p('text3')))),
                    ),
                );
                const pos = 19; // End of 'text2' in middle cell
                const $pos = node.resolve(pos);
                const result = trimTableEdgeCell($pos, 'forward');

                // Should move to start of next cell (text3)
                expect(result).toBeGreaterThan(pos);
                const $result = node.resolve(result);
                expect($result.node($result.depth - 1).textContent).toBe('text3');
                expect(result).toBe(23);
            });

            it('should move to first cell of next row when cursor at end of paragraph in last cell of row', () => {
                const node = doc(
                    yfmTable(
                        yfmTbody(
                            yfmTr(yfmTd(p('text1')), yfmTd(p('text2'))),
                            yfmTr(yfmTd(p('text3')), yfmTd(p('text4'))),
                        ),
                    ),
                );
                const pos = 19; // End of 'text2' in last cell of first row
                const $pos = node.resolve(pos);
                const result = trimTableEdgeCell($pos, 'forward');

                // Should move to start of first cell in next row (text3)
                expect(result).toBeGreaterThan(pos);
                const $result = node.resolve(result);
                expect($result.node($result.depth - 1).textContent).toBe('text3');
                expect(result).toBe(25);
            });

            it('should exit table when cursor at end of paragraph in last cell', () => {
                const node = doc(
                    p('before'),
                    yfmTable(yfmTbody(yfmTr(yfmTd(p('text1')), yfmTd(p('text2'))))),
                    p('after'),
                );
                const pos = 27; // End of 'text2' in last cell
                const $pos = node.resolve(pos);
                const result = trimTableEdgeCell($pos, 'forward');

                // Should exit table and be in the paragraph after
                expect(result).toBeGreaterThan(pos);
                const $result = node.resolve(result);
                expect($result.parent.type.name).toBe(BaseNode.Paragraph);
                expect($result.parent.textContent).toBe('after');
                expect(result).toBe(33);
            });

            it('should NOT change position when cursor at end of non-last paragraph in cell', () => {
                const node = doc(
                    yfmTable(yfmTbody(yfmTr(yfmTd(p('text1'), p('text2')), yfmTd(p('text3'))))),
                );
                const pos = 10; // End of 'text1' (first paragraph in cell with two paragraphs)
                const $pos = node.resolve(pos);
                const result = trimTableEdgeCell($pos, 'forward');

                // Position should not change (not at end of cell)
                expect(result).toBe(pos);
            });

            it('should NOT change position when cursor at start of first paragraph (not at end for forward)', () => {
                const node = doc(
                    yfmTable(yfmTbody(yfmTr(yfmTd(p('text1'), p('text2')), yfmTd(p('text3'))))),
                );
                const pos = 5; // Start of 'text1' (first paragraph)
                const $pos = node.resolve(pos);
                const result = trimTableEdgeCell($pos, 'forward');

                // Position should not change (cursor at start, not end for forward)
                expect(result).toBe(pos);
            });

            it('should move to start of first paragraph in next cell when first cell has empty paragraph', () => {
                const node = doc(yfmTable(yfmTbody(yfmTr(yfmTd(p('')), yfmTd(p('text'))))));
                const pos = 5; // Empty first cell
                const $pos = node.resolve(pos);
                const result = trimTableEdgeCell($pos, 'forward');

                // Should move to start of next cell (text)
                expect(result).toBeGreaterThan(pos);
                const $result = node.resolve(result);
                expect($result.node($result.depth - 1).textContent).toBe('text');
                expect(result).toBe(9);
            });

            it('should move to next cell when cursor at end of inline formula in paragraph (last element)', () => {
                const node = doc(
                    yfmTable(
                        yfmTbody(yfmTr(yfmTd(p('text', mathInline('x^2'))), yfmTd(p('next')))),
                    ),
                );
                // Position at end of 'x^2' inside mathInline (last char of formula)
                const pos = 13; // End of 'x^2' in mathInline
                const $pos = node.resolve(pos);
                const result = trimTableEdgeCell($pos, 'forward');

                // Should move to next cell - cursor at end of last inline block in paragraph
                expect(result).toBeGreaterThan(pos);
                const $result = node.resolve(result);
                expect($result.node($result.depth - 1).textContent).toBe('next');
                expect(result).toBe(18);
            });
        });

        describe('backward direction', () => {
            it('should NOT move position before last cell when cursor at end of paragraph', () => {
                const node = doc(yfmTable(yfmTbody(yfmTr(yfmTd(p('text1')), yfmTd(p('text2'))))));
                const pos = 19; // End of 'text2' in last cell
                const $pos = node.resolve(pos);
                const result = trimTableEdgeCell($pos, 'backward');

                // Should not move
                expect(result).toBe(pos);
            });

            it('should move to end of previous cell when cursor at start of paragraph in middle cell', () => {
                const node = doc(
                    yfmTable(
                        yfmTbody(yfmTr(yfmTd(p('text1')), yfmTd(p('text2')), yfmTd(p('text3')))),
                    ),
                );
                const pos = 14; // Start of 'text2' in middle cell
                const $pos = node.resolve(pos);
                const result = trimTableEdgeCell($pos, 'backward');

                // Should move to end of previous cell (text1)
                expect(result).toBeLessThan(pos);
                const $result = node.resolve(result);
                expect($result.node($result.depth - 1).textContent).toBe('text1');
                expect(result).toBe(10);
            });

            it('should move to end of last cell in previous row when cursor at start of paragraph in first cell of row', () => {
                const node = doc(
                    yfmTable(
                        yfmTbody(
                            yfmTr(yfmTd(p('text1')), yfmTd(p('text2'))),
                            yfmTr(yfmTd(p('text3')), yfmTd(p('text4'))),
                        ),
                    ),
                );
                const pos = 25; // Start of 'text3' in first cell of second row
                const $pos = node.resolve(pos);
                const result = trimTableEdgeCell($pos, 'backward');

                // Should move to end of last cell in previous row (text2)
                expect(result).toBeLessThan(pos);
                const $result = node.resolve(result);
                expect($result.node($result.depth - 1).textContent).toBe('text2');
                expect(result).toBe(19);
            });

            it('should exit table when cursor at start of paragraph in first cell', () => {
                const node = doc(
                    p('before'),
                    yfmTable(yfmTbody(yfmTr(yfmTd(p('text1')), yfmTd(p('text2'))))),
                    p('after'),
                );
                const pos = 13; // Start of 'text1' in first cell
                const $pos = node.resolve(pos);
                const result = trimTableEdgeCell($pos, 'backward');

                // Should exit table and be in the paragraph before
                expect(result).toBeLessThan(pos);
                const $result = node.resolve(result);
                expect($result.parent.type.name).toBe(BaseNode.Paragraph);
                expect($result.parent.textContent).toBe('before');
                expect(result).toBe(7);
            });

            it('should NOT change position when cursor at start of non-first paragraph in cell', () => {
                const node = doc(
                    yfmTable(yfmTbody(yfmTr(yfmTd(p('text1'), p('text2')), yfmTd(p('text3'))))),
                );
                const pos = 12; // Start of 'text2' (second paragraph in cell)
                const $pos = node.resolve(pos);
                const result = trimTableEdgeCell($pos, 'backward');

                // Position should not change (not at start of cell)
                expect(result).toBe(pos);
            });

            it('should NOT change position when cursor at end of last paragraph (not at start for backward)', () => {
                const node = doc(
                    yfmTable(yfmTbody(yfmTr(yfmTd(p('text1')), yfmTd(p('text2'), p('text3'))))),
                );
                const pos = 26; // End of 'text3' (last paragraph)
                const $pos = node.resolve(pos);
                const result = trimTableEdgeCell($pos, 'backward');

                // Position should not change (cursor at end, not start for backward)
                expect(result).toBe(pos);
            });

            it('should move to end of last paragraph in previous cell when last cell has empty paragraph', () => {
                const node = doc(yfmTable(yfmTbody(yfmTr(yfmTd(p('text')), yfmTd(p(''))))));
                const pos = 13; // Empty last cell
                const $pos = node.resolve(pos);
                const result = trimTableEdgeCell($pos, 'backward');

                // Should move to end of previous cell (text)
                expect(result).toBeLessThan(pos);
                const $result = node.resolve(result);
                expect($result.node($result.depth - 1).textContent).toBe('text');
                expect(result).toBe(9);
            });

            it('should move to previous cell when cursor at start of inline formula in paragraph (first element)', () => {
                const node = doc(
                    yfmTable(
                        yfmTbody(yfmTr(yfmTd(p('prev')), yfmTd(p(mathInline('x^2'), 'text')))),
                    ),
                );
                // Position at start of 'x^2' inside mathInline (first char of formula)
                const pos = 14; // Start of 'x^2' in mathInline
                const $pos = node.resolve(pos);
                const result = trimTableEdgeCell($pos, 'backward');

                // Should move to previous cell - cursor at start of first inline block in paragraph
                expect(result).toBeLessThan(pos);
                const $result = node.resolve(result);
                expect($result.node($result.depth - 1).textContent).toBe('prev');
                expect(result).toBe(9);
            });
        });
    });
});

describe('trimEmptyTableCells', () => {
    describe('Single-line tables', () => {
        it('should return original selection when no trimming needed (selection within cell)', () => {
            const node = doc(table(tbody(tr(td('text1'), td('text2')))));
            const from = 6; // 'te' in 'text1'
            const to = 8; // 'xt' in 'text1'
            const sel = TextSelection.create(node, from, to);

            const result = trimEmptyTableCells(sel);

            // Selection should not change
            expect(result.from).toBe(from);
            expect(result.to).toBe(to);
        });

        it('should return new selection when trimming needed (selection across cells)', () => {
            const node = doc(table(tbody(tr(td('text1'), td('text2')))));
            const from = 5; // Start of 'text1'
            const to = 11; // End of 'text2'
            const sel = TextSelection.create(node, from, to);

            const result = trimEmptyTableCells(sel);

            // Selection should be trimmed
            expect(result.from !== from || result.to !== to).toBe(true);
        });

        it('should return original selection when entire cell content is selected', () => {
            const node = doc(table(tbody(tr(td('text1'), td('text2')))));
            const from = 5; // Start of 'text1'
            const to = 10; // End of 'text1'
            const sel = TextSelection.create(node, from, to);

            const result = trimEmptyTableCells(sel);

            // Selection should not change (entire cell content selected)
            expect(result.from).toBe(from);
            expect(result.to).toBe(to);
        });
    });

    describe('Multi-line tables', () => {
        it('should return original selection when no trimming needed (selection within paragraph)', () => {
            const node = doc(yfmTable(yfmTbody(yfmTr(yfmTd(p('text1')), yfmTd(p('text2'))))));
            const from = 7; // 'te' in 'text1'
            const to = 9; // 'xt' in 'text1'
            const sel = TextSelection.create(node, from, to);

            const result = trimEmptyTableCells(sel);

            // Selection should not change
            expect(result.from).toBe(from);
            expect(result.to).toBe(to);
            expect(sel.eq(result)).toBe(true);
        });

        it('should return new selection when trimming needed (selection across cells)', () => {
            const node = doc(
                yfmTable(yfmTbody(yfmTr(yfmTd(p('text1')), yfmTd(p('text2')), yfmTd(p('text3'))))),
            );
            const from = 10; // End of 'text1'
            const to = 23; // Start of 'text3'
            const sel = TextSelection.create(node, from, to);

            const result = trimEmptyTableCells(sel);

            // Selection should be trimmed
            expect(result.from !== from && result.to !== to).toBe(true);
        });

        it('should return original selection when entire cell content is selected', () => {
            const node = doc(
                yfmTable(yfmTbody(yfmTr(yfmTd(p('text1')), yfmTd(p('text2')), yfmTd(p('text3'))))),
            );
            const from = 14; // Start of 'text2'
            const to = 19; // End of 'text1'
            const sel = TextSelection.create(node, from, to);

            const result = trimEmptyTableCells(sel);

            // Selection should not change (entire cell content selected)
            expect(result.from).toBe(from);
            expect(result.to).toBe(to);
        });

        it('should return empty selection when all cells are empty', () => {
            const node = doc(yfmTable(yfmTbody(yfmTr(yfmTd(p()), yfmTd(p())))));
            const from = 5; // Start of first empty cell
            const to = 9; // Start of second empty cell
            const sel = TextSelection.create(node, from, to);

            const result = trimEmptyTableCells(sel);

            // Selection should not change (entire cell content selected)
            expect(result.from).toBe(result.to);
            expect(result.from).toBe(from);
        });
    });
});
