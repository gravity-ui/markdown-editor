import {EditorState} from 'prosemirror-state';
import {builders} from 'prosemirror-test-builder';

import {ExtensionsManager} from 'src/core';
import {BaseNode, BaseSchemaSpecs} from 'src/extensions/base/specs';
import {TableDesc} from 'src/table-utils/table-desc';

import {YfmTableNode, YfmTableSpecs} from '../../../YfmTableSpecs';
import {YfmTableAttr} from '../../../const';

import {canMakeRowHeader, toggleHeaderRows} from './toggle-header-rows';

const {schema} = new ExtensionsManager({
    extensions: (builder) => builder.use(BaseSchemaSpecs, {}).use(YfmTableSpecs, {}),
}).build();

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

describe('toggleHeaderRows command', () => {
    it('should set header-rows to 1', () => {
        const editorState = EditorState.create({
            doc: doc(table(tbody(tr(td(p('A')), td(p('B'))), tr(td(p('C')), td(p('D')))))),
            schema,
        });

        let dispatched: any = null;
        const ok = toggleHeaderRows({tablePos: 0, value: 1})(editorState, (tr) => {
            dispatched = tr;
        });
        expect(ok).toBe(true);
        expect(dispatched.doc.nodeAt(0)?.attrs[YfmTableAttr.HeaderRows]).toBe(1);
    });

    it('should clamp value to table row count', () => {
        const editorState = EditorState.create({
            doc: doc(table(tbody(tr(td(p('A'))), tr(td(p('B')))))),
            schema,
        });

        let dispatched: any = null;
        toggleHeaderRows({tablePos: 0, value: 999})(editorState, (tr) => {
            dispatched = tr;
        });
        expect(dispatched.doc.nodeAt(0)?.attrs[YfmTableAttr.HeaderRows]).toBe(2);
    });

    it('should set header-rows to 0 (unset)', () => {
        const editorState = EditorState.create({
            doc: doc(table({[YfmTableAttr.HeaderRows]: 1}, tbody(tr(td(p('A'))), tr(td(p('B')))))),
            schema,
        });

        let dispatched: any = null;
        toggleHeaderRows({tablePos: 0, value: 0})(editorState, (tr) => {
            dispatched = tr;
        });
        expect(dispatched.doc.nodeAt(0)?.attrs[YfmTableAttr.HeaderRows]).toBe(0);
    });

    it('should return false when value does not change', () => {
        const editorState = EditorState.create({
            doc: doc(table({[YfmTableAttr.HeaderRows]: 1}, tbody(tr(td(p('A'))), tr(td(p('B')))))),
            schema,
        });

        const result = toggleHeaderRows({tablePos: 0, value: 1})(editorState, () => {});
        expect(result).toBe(false);
    });
});

describe('canMakeRowHeader helper', () => {
    it('should allow making row 0 header when headerRows=0', () => {
        const tableNode = table(tbody(tr(td(p('A'))), tr(td(p('B')))));
        const desc = TableDesc.create(tableNode)!;
        expect(canMakeRowHeader(desc, 0)).toBe(true);
    });

    it('should NOT allow making row 0 header when already headerRows=1', () => {
        const tableNode = table(
            {[YfmTableAttr.HeaderRows]: 1},
            tbody(tr(td(p('A'))), tr(td(p('B')))),
        );
        const desc = TableDesc.create(tableNode)!;
        expect(canMakeRowHeader(desc, 0)).toBe(false);
    });

    it('should NOT allow making row 1 header when headerRows=0 and no rowspan from row 0', () => {
        const tableNode = table(tbody(tr(td(p('A'))), tr(td(p('B')))));
        const desc = TableDesc.create(tableNode)!;
        expect(canMakeRowHeader(desc, 1)).toBe(false);
    });

    it('should allow making row 1 header when row 0 has rowspan covering row 1 (headerRows=1)', () => {
        const tableNode = table(
            {[YfmTableAttr.HeaderRows]: 1},
            tbody(tr(td({rowspan: '2'}, p('A')), td(p('B'))), tr(td(p('C')))),
        );
        const desc = TableDesc.create(tableNode)!;
        expect(canMakeRowHeader(desc, 1)).toBe(true);
    });

    it('should allow making row 2 header when row 0 has rowspan=3 covering rows 1 and 2 (headerRows=2)', () => {
        const tableNode = table(
            {[YfmTableAttr.HeaderRows]: 2},
            tbody(tr(td({rowspan: '3'}, p('A')), td(p('B'))), tr(td(p('C'))), tr(td(p('D')))),
        );
        const desc = TableDesc.create(tableNode)!;
        expect(canMakeRowHeader(desc, 2)).toBe(true);
    });
});
