import {EditorState} from 'prosemirror-state';
import {builders} from 'prosemirror-test-builder';
import {EditorView} from 'prosemirror-view';
import dd from 'ts-dedent';
import {describe, expect, it} from 'vitest';

import {dispatchPasteEvent} from '../../../../tests/dispatch-event';
import {parseDOM} from '../../../../tests/parse-dom';
import {createMarkupChecker} from '../../../../tests/sameMarkup';
import {ExtensionsManager} from '../../../core';
import {BaseNode, BaseSchemaSpecs} from '../../base/specs';
import {BlockquoteSpecs, blockquoteNodeName} from '../../markdown/Blockquote/BlockquoteSpecs';

import {YfmTableNode, YfmTableSpecs} from './YfmTableSpecs';
import {YfmTableAttr} from './const';
import {fixPastedTableBodies, unpackSingleCellTable} from './paste';

const {
    schema,
    markupParser: parser,
    serializer,
} = new ExtensionsManager({
    extensions: (builder) =>
        builder.use(BaseSchemaSpecs, {}).use(BlockquoteSpecs).use(YfmTableSpecs, {}),
}).build();

const {doc, p, bq, table, tbody, tr, td} = builders<
    'doc' | 'p' | 'bq' | 'table' | 'tbody' | 'tr' | 'td'
>(schema, {
    doc: {nodeType: BaseNode.Doc},
    p: {nodeType: BaseNode.Paragraph},
    bq: {nodeType: blockquoteNodeName},
    table: {nodeType: YfmTableNode.Table},
    tbody: {nodeType: YfmTableNode.Body},
    tr: {nodeType: YfmTableNode.Row},
    td: {nodeType: YfmTableNode.Cell},
});

const {same} = createMarkupChecker({parser, serializer});

describe('YfmTable extension', () => {
    it('should parse yfm-table', () => {
        const markup = `
#|
||

Text 1

|

Text 2

||
||

Text 3

|

Text 4

||
|#

`.trimStart();

        same(
            markup,
            doc(
                table(
                    tbody(
                        tr(td(p('Text 1')), td(p('Text 2'))),
                        tr(td(p('Text 3')), td(p('Text 4'))),
                    ),
                ),
            ),
        );
    });

    it('should parse nested yfm-table', () => {
        const markup = `
#|
||

#|
||

nested table

||
|#

||
|#

`.trimStart();

        same(markup, doc(table(tbody(tr(td(table(tbody(tr(td(p('nested table')))))))))));
    });

    it('should parse yfm-table under blockquoute', () => {
        const markup = `
> 
> #|
> ||
> 
> Text 1
>
> |
> 
> Text 2
>
> ||
> ||
> 
> Text 3
>
> |
> 
> Text 4
>
> ||
> |#
> 
`.trimStart();

        same(
            markup,
            doc(
                bq(
                    table(
                        tbody(
                            tr(td(p('Text 1')), td(p('Text 2'))),
                            tr(td(p('Text 3')), td(p('Text 4'))),
                        ),
                    ),
                ),
            ),
        );
    });

    it('should parse table from html', () => {
        parseDOM(
            schema,
            '<table><tbody><tr><td>content in cell</td></tr></tbody></table>',
            doc(table(tbody(tr(td(p('content in cell')))))),
        );
    });

    it('should parse table from broken html', () => {
        const text = 'content in thead content in tbody';
        const html =
            '<thead><tr><th>content in thead</th></tr></thead><tbody><tr><td>content in tbody</td></tr></tbody>';
        const view = new EditorView(null, {
            state: EditorState.create({schema}),
            transformPasted: (slice) => fixPastedTableBodies(slice, schema),
        });
        dispatchPasteEvent(view, {'text/html': html, 'text/plain': text});
        expect(view.state.doc).toMatchNode(
            doc(table(tbody(tr(td(p('content in thead'))), tr(td(p('content in tbody')))))),
        );
    });

    it('should transform pasted table into slice with content from single cell', () => {
        const text = 'content from cell';
        const html = '<table><tbody><tr><td>content from cell</td></tr></tbody></table>';
        const view = new EditorView(null, {
            state: EditorState.create({schema}),
            transformPasted: (slice) => unpackSingleCellTable(slice),
        });
        dispatchPasteEvent(view, {'text/html': html, 'text/plain': text});
        expect(view.state.doc).toMatchNode(doc(p('content from cell')));
    });

    it('should parse table with rowspan and colspan', () => {
        const markup = `
#|
||

1-2-3-5

|>|>|

4

||
||

^|^|^|

8

||
||

^|^|^|

12

||
||

13

|

14

|

15

|

16

||
|#

`.trimStart();

        same(
            markup,
            doc(
                table(
                    tbody(
                        tr(
                            td(
                                {
                                    [YfmTableAttr.Colspan]: '3',
                                    [YfmTableAttr.Rowspan]: '3',
                                },
                                p('1-2-3-5'),
                            ),
                            td(p('4')),
                        ),
                        tr(td(p('8'))),
                        tr(td(p('12'))),
                        tr(td(p('13')), td(p('14')), td(p('15')), td(p('16'))),
                    ),
                ),
            ),
        );
    });

    it('should parse and serialize table with multiple rowspans', () => {
        const markup = `
#|
||

1-5-9

|

2

|

3

|

4

||
||

^|

6-10-14

|

7

|

8

||
||

^|^|

11-15-19

|

12

||
||

13

|^|^|

16-20

||
||

17

|

18

|^|^
||
|#

`.trimStart();

        same(
            markup,
            doc(
                table(
                    tbody(
                        tr(
                            td({[YfmTableAttr.Rowspan]: '3'}, p('1-5-9')),
                            td(p('2')),
                            td(p('3')),
                            td(p('4')),
                        ),
                        tr(td({[YfmTableAttr.Rowspan]: '3'}, p('6-10-14')), td(p('7')), td(p('8'))),
                        tr(td({[YfmTableAttr.Rowspan]: '3'}, p('11-15-19')), td(p('12'))),
                        tr(td(p('13')), td({[YfmTableAttr.Rowspan]: '2'}, p('16-20'))),
                        tr(td(p('17')), td(p('18'))),
                    ),
                ),
            ),
        );
    });

    it('should parse and serialize table with multiple colspans', () => {
        const markup = `
#|
||

1-2-3

|>|>|

4

|

5

||
||

6

|

7-8-9

|>|>|

10

||
||

11

|

12

|

13-14-15

|>|>
||
|#

`.trimStart();

        same(
            markup,
            doc(
                table(
                    tbody(
                        tr(td({[YfmTableAttr.Colspan]: '3'}, p('1-2-3')), td(p('4')), td(p('5'))),
                        tr(td(p('6')), td({[YfmTableAttr.Colspan]: '3'}, p('7-8-9')), td(p('10'))),
                        tr(
                            td(p('11')),
                            td(p('12')),
                            td({[YfmTableAttr.Colspan]: '3'}, p('13-14-15')),
                        ),
                    ),
                ),
            ),
        );
    });

    it('should parse and serialize table with multiple colspans in one row', () => {
        const markup = `
#|
||

1-2

|>|

3

|

4-5

|>
||
||

6

|

7

|

8

|

9

|

10

||
|#

`.trimStart();

        same(
            markup,
            doc(
                table(
                    tbody(
                        tr(
                            td({[YfmTableAttr.Colspan]: '2'}, p('1-2')),
                            td(p('3')),
                            td({[YfmTableAttr.Colspan]: '2'}, p('4-5')),
                        ),
                        tr(td(p('6')), td(p('7')), td(p('8')), td(p('9')), td(p('10'))),
                    ),
                ),
            ),
        );
    });

    it('should parse and serialize table with multiple rowspans in one column', () => {
        const markup = `
#|
||

1-3

|

2

||
||

^|

4

||
||

5

|

6

||
||

7-9

|

8

||
||

^|

10

||
|#

`.trimStart();

        same(
            markup,
            doc(
                table(
                    tbody(
                        tr(td({[YfmTableAttr.Rowspan]: '2'}, p('1-3')), td(p('2'))),
                        tr(td(p('4'))),
                        tr(td(p('5')), td(p('6'))),
                        tr(td({[YfmTableAttr.Rowspan]: '2'}, p('7-9')), td(p('8'))),
                        tr(td(p('10'))),
                    ),
                ),
            ),
        );
    });

    it('should parse table with header-rows attribute', () => {
        const markup = dd`
            #|
            |:{header-rows="1"}
            ||

            Header 1

            |

            Header 2

            ||
            ||

            Cell 1

            |

            Cell 2

            ||
            |#


            `;

        same(
            markup,
            doc(
                table(
                    {[YfmTableAttr.HeaderRows]: 1},
                    tbody(
                        tr(td(p('Header 1')), td(p('Header 2'))),
                        tr(td(p('Cell 1')), td(p('Cell 2'))),
                    ),
                ),
            ),
        );
    });

    it('should parse table with header-rows="2"', () => {
        const markup = dd`
            #|
            |:{header-rows="2"}
            ||

            H1

            |

            H2

            ||
            ||

            H3

            |

            H4

            ||
            ||

            Cell 1

            |

            Cell 2

            ||
            |#


            `;

        same(
            markup,
            doc(
                table(
                    {[YfmTableAttr.HeaderRows]: 2},
                    tbody(
                        tr(td(p('H1')), td(p('H2'))),
                        tr(td(p('H3')), td(p('H4'))),
                        tr(td(p('Cell 1')), td(p('Cell 2'))),
                    ),
                ),
            ),
        );
    });

    it.each([
        ['cell-align-top-left', 'top-left'],
        ['cell-align-top-center', 'top-center'],
        ['cell-align-top-right', 'top-right'],
        ['cell-align-center', 'center'],
        ['cell-align-bottom-left', 'bottom-left'],
        ['cell-align-bottom-center', 'bottom-center'],
        ['cell-align-bottom-right', 'bottom-right'],
    ])('should serialize %s as a cell attribute when enabled', (cellAlign, align) => {
        const {markupParser: tableParser, serializer: tableSerializer} = new ExtensionsManager({
            extensions: (builder) =>
                builder.use(BaseSchemaSpecs, {}).use(YfmTableSpecs, {newCellAlignSyntax: true}),
        }).buildDeps();
        const tableDoc = doc(
            table(tbody(tr(td({[YfmTableAttr.CellAlign]: cellAlign}, p('Cell'))))),
        );
        const expected = `#|\n||::{align="${align}"}\n\nCell\n\n||\n|#\n\n`;

        expect(tableSerializer.serialize(tableDoc)).toBe(expected);
        expect(tableParser.parse(expected)).toMatchNodeJson(tableDoc);
    });

    it.each([{}, {newCellAlignSyntax: false}])(
        'should keep legacy alignment serialization with options %j',
        (options) => {
            const {serializer: tableSerializer} = new ExtensionsManager({
                extensions: (builder) =>
                    builder.use(BaseSchemaSpecs, {}).use(YfmTableSpecs, options),
            }).buildDeps();
            const tableDoc = doc(
                table(tbody(tr(td({[YfmTableAttr.CellAlign]: 'cell-align-center'}, p('Cell'))))),
            );
            const expected = '#|\n||\n\nCell\n\n{.cell-align-center}\n||\n|#\n\n';

            expect(tableSerializer.serialize(tableDoc)).toBe(expected);
        },
    );

    it('should serialize alignment and background in the same cell attributes', () => {
        const {markupParser: tableParser, serializer: tableSerializer} = new ExtensionsManager({
            extensions: (builder) =>
                builder.use(BaseSchemaSpecs, {}).use(YfmTableSpecs, {newCellAlignSyntax: true}),
        }).buildDeps();
        const tableDoc = doc(
            table(
                tbody(
                    tr(
                        td(
                            {
                                [YfmTableAttr.CellBg]: 'info',
                                [YfmTableAttr.CellAlign]: 'cell-align-center',
                            },
                            p('First'),
                        ),
                        td(
                            {
                                [YfmTableAttr.CellBg]: 'warning',
                                [YfmTableAttr.CellAlign]: 'cell-align-bottom-right',
                            },
                            p('Second'),
                        ),
                    ),
                ),
            ),
        );
        const expected = dd`
            #|
            ||::{bg="info" align="center"}

            First

            |::{bg="warning" align="bottom-right"}

            Second

            ||
            |#


            `;

        expect(tableSerializer.serialize(tableDoc)).toBe(expected);
        expect(tableParser.parse(expected)).toMatchNodeJson(tableDoc);
    });

    it('should place cell attributes after a leading rowspan marker', () => {
        const {markupParser: tableParser, serializer: tableSerializer} = new ExtensionsManager({
            extensions: (builder) =>
                builder.use(BaseSchemaSpecs, {}).use(YfmTableSpecs, {newCellAlignSyntax: true}),
        }).buildDeps();
        const tableDoc = doc(
            table(
                tbody(
                    tr(td({[YfmTableAttr.Rowspan]: '2'}, p('First')), td(p('Other'))),
                    tr(
                        td(
                            {
                                [YfmTableAttr.CellBg]: 'warning',
                                [YfmTableAttr.CellAlign]: 'cell-align-bottom-right',
                            },
                            p('Second'),
                        ),
                    ),
                ),
            ),
        );
        const expected = dd`
            #|
            ||

            First

            |

            Other

            ||
            ||

            ^|::{bg="warning" align="bottom-right"}

            Second

            ||
            |#


            `;

        expect(tableSerializer.serialize(tableDoc)).toBe(expected);
        expect(tableParser.parse(expected)).toMatchNodeJson(tableDoc);
    });

    it.each([
        {
            name: 'a blockquote',
            content: bq(p('Cell')),
            expectedMarkup: dd`
                #|
                ||::{align="center"}

                > Cell

                ||
                |#


                `,
        },
        {
            name: 'a nested table',
            content: table(tbody(tr(td(p('Cell'))))),
            expectedMarkup: dd`
                #|
                ||::{align="center"}

                #|
                ||

                Cell

                ||
                |#

                ||
                |#


                `,
        },
    ])(
        'should serialize and parse alignment in cells containing $name',
        ({content, expectedMarkup}) => {
            const {markupParser: tableParser, serializer: tableSerializer} = new ExtensionsManager({
                extensions: (builder) =>
                    builder
                        .use(BaseSchemaSpecs, {})
                        .use(BlockquoteSpecs)
                        .use(YfmTableSpecs, {newCellAlignSyntax: true}),
            }).buildDeps();
            const expectedDoc = doc(
                table(tbody(tr(td({[YfmTableAttr.CellAlign]: 'cell-align-center'}, content)))),
            );

            expect(tableSerializer.serialize(expectedDoc)).toBe(expectedMarkup);
            expect(tableParser.parse(expectedMarkup)).toMatchNodeJson(expectedDoc);
        },
    );

    it.each([false, true])(
        'should serialize edited aligned cells as cell attributes (preserveEmptyRows=%s)',
        (preserveEmptyRows) => {
            const {markupParser: tableParser, serializer: tableSerializer} = new ExtensionsManager({
                extensions: (builder) =>
                    builder
                        .use(BaseSchemaSpecs, {preserveEmptyRows})
                        .use(YfmTableSpecs, {newCellAlignSyntax: true}),
            }).buildDeps();
            const markup = dd`
            #|
            ||
            Cell 1
            {.cell-align-center}
            | Cell 2 ||
            || ^ | Cell 10000000000 {.cell-align-center} ||
            |#
        `;
            const state = EditorState.create({doc: tableParser.parse(markup)});
            const transaction = state.tr;
            state.doc.descendants((node, pos) => {
                if (node.text === 'Cell 10000000000') {
                    transaction.insertText('0', pos + node.nodeSize);
                }
            });
            const expectedDoc = doc(
                table(
                    tbody(
                        tr(
                            td(
                                {
                                    [YfmTableAttr.Rowspan]: '2',
                                    [YfmTableAttr.CellAlign]: 'cell-align-center',
                                },
                                p('Cell 1'),
                            ),
                            td(p('Cell 2')),
                        ),
                        tr(
                            td(
                                {[YfmTableAttr.CellAlign]: 'cell-align-center'},
                                p('Cell 100000000000'),
                            ),
                        ),
                    ),
                ),
            );
            const expectedMarkup = dd`
                #|
                ||::{align="center"}

                Cell 1

                |

                Cell 2

                ||
                ||

                ^|::{align="center"}

                Cell 100000000000

                ||
                |#


                `;
            const editedDoc = state.apply(transaction).doc;

            expect(editedDoc).toMatchNodeJson(expectedDoc);
            expect(tableSerializer.serialize(editedDoc)).toBe(expectedMarkup);
            expect(tableParser.parse(expectedMarkup)).toMatchNodeJson(expectedDoc);
        },
    );

    it.each([false, true])(
        'should serialize and parse an empty paragraph in an aligned cell (blockquote=%s)',
        (blockquote) => {
            const {markupParser: tableParser, serializer: tableSerializer} = new ExtensionsManager({
                extensions: (builder) =>
                    builder
                        .use(BaseSchemaSpecs, {preserveEmptyRows: true})
                        .use(BlockquoteSpecs)
                        .use(YfmTableSpecs, {newCellAlignSyntax: true}),
            }).buildDeps();
            const markup = dd`
            #|
            ||
            Cell

            &nbsp; {.cell-align-center}
            ||
            |#
        `;
            const tableNode = table(
                tbody(
                    tr(td({[YfmTableAttr.CellAlign]: 'cell-align-center'}, p('Cell'), p('\u00a0'))),
                ),
            );
            const expectedDoc = doc(blockquote ? bq(tableNode) : tableNode);
            const expectedMarkup = blockquote
                ? dd`
                    >\u0020
                    > #|
                    > ||::{align="center"}
                    >\u0020
                    > Cell
                    >
                    > &nbsp;
                    >\u0020
                    > ||
                    > |#
                    >\u0020

                    `
                : dd`
                    #|
                    ||::{align="center"}

                    Cell

                    &nbsp;

                    ||
                    |#


                    `;

            expect(
                tableParser.parse(blockquote ? markup.replace(/^/gm, '> ') : markup),
            ).toMatchNodeJson(expectedDoc);
            expect(tableSerializer.serialize(expectedDoc)).toBe(expectedMarkup);
            expect(tableParser.parse(expectedMarkup)).toMatchNodeJson(expectedDoc);
        },
    );

    it('should preserve cell-align', () => {
        const markup = `
#|
||

cell11

{.cell-align-bottom-right}
||
|#

`.trimStart();

        same(
            markup,
            doc(
                table(
                    tbody(
                        tr(
                            td(
                                {[YfmTableAttr.CellAlign]: 'cell-align-bottom-right'},
                                p('cell11'),
                                p(''),
                            ),
                        ),
                    ),
                ),
            ),
        );
    });

    describe('cell-bg serialization', () => {
        it('should serialize cell-bg on first cell (same line as ||)', () => {
            const markup = dd`
                #|
                ||::{bg="info"}

                cell11

                ||
                |#

                
                `.trimStart();

            same(markup, doc(table(tbody(tr(td({[YfmTableAttr.CellBg]: 'info'}, p('cell11')))))));
        });

        it('should serialize cell-bg on non-first cell (same line as |)', () => {
            const markup = dd`
                #|
                ||

                cell11

                |::{bg="warning"}

                cell12

                ||
                |#

                
                `.trimStart();

            same(
                markup,
                doc(
                    table(
                        tbody(
                            tr(
                                td(p('cell11')),
                                td({[YfmTableAttr.CellBg]: 'warning'}, p('cell12')),
                            ),
                        ),
                    ),
                ),
            );
        });

        it('should serialize cell-bg on multiple cells', () => {
            const markup = dd`
                #|
                ||::{bg="info"}

                cell11

                |::{bg="danger"}

                cell12

                ||
                |#

                
                `.trimStart();

            same(
                markup,
                doc(
                    table(
                        tbody(
                            tr(
                                td({[YfmTableAttr.CellBg]: 'info'}, p('cell11')),
                                td({[YfmTableAttr.CellBg]: 'danger'}, p('cell12')),
                            ),
                        ),
                    ),
                ),
            );
        });
    });
});
