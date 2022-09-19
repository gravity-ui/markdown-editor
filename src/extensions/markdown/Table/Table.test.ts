import {builders} from 'prosemirror-test-builder';
import {createMarkupChecker} from '../../../../tests/sameMarkup';
import {ExtensionsManager} from '../../../core';
import {BaseNode, BaseSchemaE} from '../../base/BaseSchema';
import {blockquote, BlockquoteE} from '../Blockquote';
import {CellAlign, TableAttrs, TableNode} from './const';
import {TableE} from './index';

const {schema, parser, serializer} = new ExtensionsManager({
    extensions: [BaseSchemaE(), BlockquoteE(), TableE()],
}).buildDeps();

const {doc, bq, table, thead, tbody, tr, thL, thC, thR, tdL, tdC, tdR} = builders(schema, {
    doc: {nodeType: BaseNode.Doc},
    bq: {nodeType: blockquote},
    table: {nodeType: TableNode.Table},
    thead: {nodeType: TableNode.Head},
    tbody: {nodeType: TableNode.Body},
    tr: {nodeType: TableNode.Row},
    thL: {nodeType: TableNode.HeaderCell, [TableAttrs.CellAlign]: CellAlign.Left},
    thC: {nodeType: TableNode.HeaderCell, [TableAttrs.CellAlign]: CellAlign.Center},
    thR: {nodeType: TableNode.HeaderCell, [TableAttrs.CellAlign]: CellAlign.Right},
    tdL: {nodeType: TableNode.DataCell, [TableAttrs.CellAlign]: CellAlign.Left},
    tdC: {nodeType: TableNode.DataCell, [TableAttrs.CellAlign]: CellAlign.Center},
    tdR: {nodeType: TableNode.DataCell, [TableAttrs.CellAlign]: CellAlign.Right},
}) as PMTestBuilderResult<
    | 'doc'
    | 'bq'
    | 'table'
    | 'thead'
    | 'tbody'
    | 'tr'
    | 'thL'
    | 'thC'
    | 'thR'
    | 'tdL'
    | 'tdC'
    | 'tdR'
>;

const {same} = createMarkupChecker({parser, serializer});

describe('Table extension', () => {
    it('should parse table', () => {
        const markup = [
            '',
            '|Header 1|Header 2|Header 3|',
            '|:---|:---:|---:|',
            '|Text 1|Text 2|Text 3|',
            '|Text 4|Text 5|Text 6|',
            '',
        ].join('\n');

        same(
            markup,
            doc(
                table(
                    thead(tr(thL('Header 1'), thC('Header 2'), thR('Header 3'))),
                    tbody(
                        tr(tdL('Text 1'), tdC('Text 2'), tdR('Text 3')),
                        tr(tdL('Text 4'), tdC('Text 5'), tdR('Text 6')),
                    ),
                ),
            ),
        );
    });

    // TODO: fix it
    it.skip('should parse table under blockquoute', () => {
        const markup = [
            '',
            '> |Header 1|Header 2|Header 3|',
            '> |:---|:---:|---:|',
            '> |Text 1|Text 2|Text 3|',
            '> |Text 4|Text 5|Text 6|',
            '',
        ].join('\n');

        same(
            markup,
            doc(
                bq(
                    table(
                        thead(tr(thL('Header 1'), thC('Header 2'), thR('Header 3'))),
                        tbody(
                            tr(tdL('Text 1'), tdC('Text 2'), tdR('Text 3')),
                            tr(tdL('Text 4'), tdC('Text 5'), tdR('Text 6')),
                        ),
                    ),
                ),
            ),
        );
    });
});
