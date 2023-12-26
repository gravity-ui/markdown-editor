import {builders} from 'prosemirror-test-builder';

import {parseDOM} from '../../../../tests/parse-dom';
import {createMarkupChecker} from '../../../../tests/sameMarkup';
import {ExtensionsManager} from '../../../core';
import {BaseNode, BaseSpecsPreset} from '../../base/specs';
import {BlockquoteSpecs, blockquoteNodeName} from '../Blockquote/BlockquoteSpecs';

import {TableSpecs} from './TableSpecs';
import {CellAlign, TableAttrs, TableNode} from './const';

const {schema, parser, serializer} = new ExtensionsManager({
    extensions: (builder) => builder.use(BaseSpecsPreset, {}).use(BlockquoteSpecs).use(TableSpecs),
}).buildDeps();

const {doc, bq, table, thead, tbody, tr, thL, thC, thR, tdL, tdC, tdR} = builders<
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
>(schema, {
    doc: {nodeType: BaseNode.Doc},
    bq: {nodeType: blockquoteNodeName},
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
});

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

    it('should parse html', () => {
        parseDOM(
            schema,
            '<table>' +
                '<thead>' +
                '<tr><th>1</th><th>2</th></tr>' +
                '</thead>' +
                '<tbody>' +
                '<tr><td>3</td><td>4</td></tr>' +
                '<tr><td>5</td><td>6</td></tr>' +
                '</tbody>' +
                '</tbody>',
            doc(
                table(
                    thead(tr(thL('1'), thL('2'))),
                    tbody(tr(tdL('3'), tdL('4')), tr(tdL('5'), tdL('6'))),
                ),
            ),
        );
    });
});
