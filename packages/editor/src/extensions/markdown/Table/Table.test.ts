import {EditorState} from 'prosemirror-state';
import {builders} from 'prosemirror-test-builder';
import {describe, expect, it} from 'vitest';

import {parseDOM} from '../../../../tests/parse-dom';
import {createMarkupChecker} from '../../../../tests/sameMarkup';
import {ExtensionsManager} from '../../../core';
import {BaseNode, BaseSchemaSpecs} from '../../base/specs';
import {BlockquoteSpecs, blockquoteNodeName} from '../Blockquote/BlockquoteSpecs';
import {BoldSpecs, CodeSpecs, ImageSpecs, ItalicSpecs} from '../specs';

import {TableSpecs} from './TableSpecs';
import {CellAlign, TableAttrs, TableNode} from './const';

const {
    schema,
    markupParser: parser,
    serializer,
} = new ExtensionsManager({
    extensions: (builder) =>
        builder
            .use(BaseSchemaSpecs, {})
            .use(BlockquoteSpecs)
            .use(TableSpecs)
            .use(BoldSpecs)
            .use(ItalicSpecs)
            .use(CodeSpecs)
            .use(ImageSpecs),
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

    it('should parse table under blockquoute', () => {
        const markup = [
            '> ',
            '> ',
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

describe('single-line serialization', () => {
    const blocks = [
        {name: 'table header', markup: '| TITLE | b |\n|---|---|\n| c | d |'},
        {name: 'table cell', markup: '| a | b |\n|---|---|\n| TITLE | z |'},
    ];
    describe.each([
        {name: 'LF', entity: '&#10;'},
        {name: 'CR', entity: '&#13;'},
        {name: 'CRLF', entity: '&#13;&#10;'},
    ])('single-line serialization with $name', ({entity}) => {
        it.each(blocks)('should normalize marked text in a $name', ({markup}) => {
            const input = parser.parse(markup.replace('TITLE', `*&#32;x${entity}y*`));
            const expected = parser.parse(markup.replace('TITLE', ' *x y*'));

            expect(parser.parse(serializer.serialize(input))).toMatchNode(expected);
        });
    });

    describe('single-line serialization with inline code', () => {
        it.each(blocks)('should keep code and adjacent images in a $name', ({markup}) => {
            const expected = parser.parse(markup.replace('TITLE', '**A** *`x y`* ![i](img)'));
            let textPosition = -1;
            expected.descendants((node, pos) => {
                if (node.isText && node.text === 'x y') textPosition = pos;
            });
            expect(textPosition).toBeGreaterThan(-1);
            const input = EditorState.create({doc: expected}).tr.insertText(
                'x\ny',
                textPosition,
                textPosition + 3,
            ).doc;

            expect(parser.parse(serializer.serialize(input))).toMatchNode(expected);
        });
    });
});
