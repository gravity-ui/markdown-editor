import {EditorState} from 'prosemirror-state';
import {builders} from 'prosemirror-test-builder';
import {EditorView} from 'prosemirror-view';

import {dispatchPasteEvent} from '../../../../tests/dispatch-event';
import {parseDOM} from '../../../../tests/parse-dom';
import {createMarkupChecker} from '../../../../tests/sameMarkup';
import {ExtensionsManager} from '../../../core';
import {BaseNode, BaseSchemaSpecs} from '../../base/specs';
import {BlockquoteSpecs, blockquoteNodeName} from '../../markdown/Blockquote/BlockquoteSpecs';

import {YfmTableNode, YfmTableSpecs} from './YfmTableSpecs';
import {YfmTableAttr} from './const';
import {fixPastedTableBodies} from './paste';

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
});
