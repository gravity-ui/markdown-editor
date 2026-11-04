import {history, undo} from 'prosemirror-history';
import {builders} from 'prosemirror-test-builder';
import {beforeEach, describe, expect, it} from 'vitest';

import {ExtensionsManager} from '#core';
import type {Node} from '#pm/model';
import {EditorState} from '#pm/state';
import {BaseNode, BaseSchemaSpecs} from 'src/extensions/base/specs';
import {TableCellSelection} from 'src/table-utils/cell-selection';

import {YfmTableAttr, YfmTableNode} from '../../../YfmTableSpecs/const';
import {YfmTable} from '../../../index';

import {setCellBg} from './set-cell-bg';

const {schema} = new ExtensionsManager({
    extensions: (builder) => builder.use(BaseSchemaSpecs, {}).use(YfmTable, {controls: false}),
}).buildDeps();

const {doc, p, table, tbody, tr, td} = builders<'doc' | 'p' | 'table' | 'tbody' | 'tr' | 'td'>(
    schema,
    {
        doc: {nodeType: BaseNode.Doc},
        p: {nodeType: BaseNode.Paragraph},
        table: {nodeType: YfmTableNode.Table},
        tbody: {nodeType: YfmTableNode.Body},
        tr: {nodeType: YfmTableNode.Row},
        td: {nodeType: YfmTableNode.Cell},
    },
);

describe('setCellBg rectangle', () => {
    describe('regular cells', () => {
        const initialDoc = doc(
            table(
                tbody(
                    tr('<anchor>', td(p('A')), td(p('B')), td(p('C'))),
                    tr(td(p('D')), '<head>', td(p('E')), td(p('F'))),
                ),
            ),
        );
        const selection = TableCellSelection.create(
            initialDoc,
            initialDoc.tag.anchor,
            initialDoc.tag.head,
        );
        let state: EditorState;

        beforeEach(() => {
            state = EditorState.create({doc: initialDoc, selection, plugins: [history()]});
            setCellBg({tablePos: 0, rect: selection.rect, bg: 'blue'})(state, (transaction) => {
                state = state.apply(transaction);
            });
        });

        it('should color only selected cells', () => {
            expect(backgrounds(state.doc)).toEqual(['blue', 'blue', null, 'blue', 'blue', null]);
        });

        it('should preserve cell content', () => {
            expect(state.doc.textContent).toBe(initialDoc.textContent);
        });

        it('should preserve the cell selection', () => {
            expect(state.selection.eq(selection)).toBe(true);
        });

        it('should undo the background change in one step', () => {
            undo(state, (transaction) => {
                state = state.apply(transaction);
            });
            expect(state.doc.eq(initialDoc)).toBe(true);
        });
    });

    describe('merged cells', () => {
        it('should color only the selected merged cell', () => {
            const initialDoc = doc(
                table(tbody(tr(td({rowspan: 2, colspan: 2}, p('A')), td(p('B'))), tr(td(p('C'))))),
            );
            let state = EditorState.create({doc: initialDoc});
            setCellBg({tablePos: 0, rect: {top: 0, left: 0, bottom: 2, right: 2}, bg: 'red'})(
                state,
                (transaction) => {
                    state = state.apply(transaction);
                },
            );
            expect(backgrounds(state.doc)).toEqual(['red', null, null]);
        });

        it('should clear the background of a merged cell', () => {
            let state = EditorState.create({
                doc: doc(
                    table(
                        tbody(
                            tr(
                                td({rowspan: 2, colspan: 2, [YfmTableAttr.CellBg]: 'red'}, p('A')),
                                td(p('B')),
                            ),
                            tr(td(p('C'))),
                        ),
                    ),
                ),
            });
            setCellBg({tablePos: 0, rect: {top: 0, left: 0, bottom: 2, right: 2}, bg: null})(
                state,
                (transaction) => {
                    state = state.apply(transaction);
                },
            );
            const expectedDoc = doc(
                table(tbody(tr(td({rowspan: 2, colspan: 2}, p('A')), td(p('B'))), tr(td(p('C'))))),
            );
            expect(state.doc.eq(expectedDoc)).toBe(true);
        });
    });
});

function backgrounds(node: Node): unknown[] {
    const result: unknown[] = [];
    node.descendants((child) => {
        if (child.type.name === YfmTableNode.Cell) result.push(child.attrs[YfmTableAttr.CellBg]);
    });
    return result;
}
