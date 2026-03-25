import type {Node} from '#pm/model';
import {TextSelection} from '#pm/state';
import {builders} from '#pm/test-builder';

import {ExtensionsManager} from '../../../core';
import {BaseNode, BaseSchemaSpecs} from '../../base/BaseSchema/BaseSchemaSpecs';
import {BlockquoteSpecs, blockquoteNodeName} from '../../markdown/Blockquote/BlockquoteSpecs';
import {ListNode, ListsSpecs} from '../../markdown/Lists/ListsSpecs';
import {TableNode, TableSpecs} from '../../markdown/Table/TableSpecs';
import {YfmTableNode, YfmTableSpecs} from '../../yfm/YfmTable/YfmTableSpecs';

import {getSelectionContent} from './selection-content';

function buildDeps() {
    return new ExtensionsManager({
        extensions: (builder) => {
            builder
                .use(BaseSchemaSpecs, {})
                .use(BlockquoteSpecs)
                .use(ListsSpecs)
                .use(TableSpecs)
                .use(YfmTableSpecs, {});
        },
    }).buildDeps();
}

const {schema} = buildDeps();

const {
    doc,
    p,
    bquote,
    ul,
    ol,
    li,
    table,
    thead,
    tbody,
    tr,
    th,
    td,
    yfmTable,
    yfmTbody,
    yfmTr,
    yfmTd,
} = builders<
    | 'doc'
    | 'p'
    | 'bquote'
    | 'ul'
    | 'ol'
    | 'li'
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
>(schema, {
    doc: {nodeType: BaseNode.Doc},
    p: {nodeType: BaseNode.Paragraph},
    bquote: {nodeType: blockquoteNodeName},
    ul: {nodeType: ListNode.BulletList},
    ol: {nodeType: ListNode.OrderedList},
    li: {nodeType: ListNode.ListItem},
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
});

function createSelection(node: Node, from: number, to: number) {
    return TextSelection.create(node, from, to);
}

describe('getSelectionContent', () => {
    describe('simple list (no outer container)', () => {
        it('should include bullet_list wrapper when selecting across list items', () => {
            // doc > ul > li > p > "text"
            const node = doc(ul(li(p('item1')), li(p('item2')), li(p('item3'))));
            // Select from start of 'item1' to end of 'item3'
            const from = 3; // start of 'item1'
            const to = 26; // end of 'item3'
            const sel = createSelection(node, from, to);
            const slice = getSelectionContent(sel);

            // Slice should contain the bullet_list as a wrapper
            expect(slice.content.firstChild?.type.name).toBe(ListNode.BulletList);
            expect(slice.content.childCount).toBe(1);
            expect(slice.content.firstChild).toMatchNode(
                ul(li(p('item1')), li(p('item2')), li(p('item3'))),
            );
        });

        it('should include ordered_list wrapper when selecting across list items', () => {
            const node = doc(ol(li(p('item1')), li(p('item2'))));
            const from = 3; // start of 'item1'
            const to = 17; // end of 'item2'
            const sel = createSelection(node, from, to);
            const slice = getSelectionContent(sel);

            expect(slice.content.firstChild?.type.name).toBe(ListNode.OrderedList);
            expect(slice.content.childCount).toBe(1);
            expect(slice.content.firstChild).toMatchNode(ol(li(p('item1')), li(p('item2'))));
        });
    });

    describe('list inside blockquote', () => {
        it('should include bullet_list but NOT blockquote when selecting list items inside blockquote', () => {
            // doc > bquote > ul > li > p > "text"
            const node = doc(bquote(ul(li(p('item1')), li(p('item2')))));
            // Select from start of 'item1' to end of 'item2'
            const from = 4; // start of 'item1'
            const to = 18; // end of 'item2'
            const sel = createSelection(node, from, to);
            const slice = getSelectionContent(sel);

            // Should contain bullet_list, NOT blockquote
            expect(slice.content.firstChild?.type.name).toBe(ListNode.BulletList);
            expect(slice.content.childCount).toBe(1);
            expect(slice.content.firstChild).toMatchNode(ul(li(p('item1')), li(p('item2'))));
        });

        it('should include bullet_list but NOT blockquote when selecting partial list items', () => {
            const node = doc(bquote(ul(li(p('item1')), li(p('item2')), li(p('item3')))));
            // Select from middle of 'item1' to middle of 'item2'
            const from = 6; // middle of 'item1' (it|em1)
            const to = 15; // middle of 'item2' (it|em2)
            const sel = createSelection(node, from, to);
            const slice = getSelectionContent(sel);

            // Should contain bullet_list, NOT blockquote
            expect(slice.content.firstChild?.type.name).toBe(ListNode.BulletList);
            expect(slice.content.childCount).toBe(1);
            expect(slice.content.firstChild).toMatchNode(ul(li(p('em1')), li(p('it'))));
        });
    });

    describe('selection inside table', () => {
        it('should return slice with only selected text, not table wrapper, when selecting within a single cell', () => {
            const node = doc(
                table(thead(tr(th('head1'), th('head2'))), tbody(tr(td('cell1'), td('cell2')))),
            );
            const from = 22; // start of 'cell1'
            const to = 25; // // middle of 'cell1' (cel|l1)
            const sel = createSelection(node, from, to);
            const slice = getSelectionContent(sel);

            // Shared node is td (complex: 'leaf'), should return simple slice without table
            expect(slice.content.firstChild?.type.name).not.toBe(TableNode.Table);
            expect(slice.content.firstChild?.type.name).not.toBe(TableNode.DataCell);
            expect(slice.content.childCount).toBe(1);
            expect(slice.content.firstChild?.textContent).toBe('cel');
        });

        it('should return slice with table wrapper when selecting across multiple cells', () => {
            const node = doc(
                table(thead(tr(th('head1'), th('head2'))), tbody(tr(td('cell1'), td('cell2')))),
            );
            const from = 22; // start of 'cell1'
            const to = 34; // // end of 'cell2'
            const sel = createSelection(node, from, to);
            const slice = getSelectionContent(sel);

            // Shared node is tr (complex: 'inner'), should find table (complex: 'root')
            // and include it in the slice
            expect(slice.content.firstChild?.type.name).toBe(TableNode.Table);
            expect(slice.content.childCount).toBe(1);
            expect(slice.content.firstChild).toMatchNode(
                table(tbody(tr(td('cell1'), td('cell2')))),
            );
        });
    });

    describe('list inside yfm table cell', () => {
        it('should include bullet_list but NOT yfm_table when selecting list items inside yfm table cell', () => {
            const node = doc(yfmTable(yfmTbody(yfmTr(yfmTd(ul(li(p('item1')), li(p('item2'))))))));

            const from = 7; // start of 'item1'
            const to = 21; // end of 'item2'
            const sel = createSelection(node, from, to);
            const slice = getSelectionContent(sel);

            // Should contain bullet_list, NOT yfm_table structure
            expect(slice.content.firstChild?.type.name).toBe(ListNode.BulletList);
            expect(slice.content.childCount).toBe(1);
            expect(slice.content.firstChild).toMatchNode(ul(li(p('item1')), li(p('item2'))));
        });
    });

    describe('non-complex shared node', () => {
        it('should return simple slice without parent wrapping for plain paragraphs', () => {
            const node = doc(p('text1'), p('text2'));

            const from = 1; // start of 'text1'
            const to = 13; // end of 'text2'
            const sel = createSelection(node, from, to);
            const slice = getSelectionContent(sel);

            // Shared node is doc (not complex), should return a simple slice
            expect(slice.content.childCount).toBe(2);
            expect(slice.content.firstChild).toMatchNode(p('text1'));
            expect(slice.content.lastChild).toMatchNode(p('text2'));
        });

        it('should return simple slice for selection inside blockquote paragraphs', () => {
            const node = doc(bquote(p('text1'), p('text2')));

            const from = 2; // start of 'text1'
            const to = 14; // end of 'text2'
            const sel = createSelection(node, from, to);
            const slice = getSelectionContent(sel);

            // Shared node is blockquote (not complex), should be simple slice
            expect(slice.content.childCount).toBe(2);
            expect(slice.content.firstChild).toMatchNode(p('text1'));
            expect(slice.content.lastChild).toMatchNode(p('text2'));
        });
    });
});
