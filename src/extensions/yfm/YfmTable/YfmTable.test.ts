import {builders} from 'prosemirror-test-builder';
import {createMarkupChecker} from '../../../../tests/sameMarkup';
import {createExtension, ExtensionsManager} from '../../../core';
import {BaseNode, BaseSchemaE} from '../../base/BaseSchema';
import {blockquote, BlockquoteE} from '../../markdown/Blockquote';
import {YfmTableNode} from './const';
import {YfmTable} from './index';

const YfmTableE = createExtension((builder) => builder.use(YfmTable, {}));

const {schema, parser, serializer} = new ExtensionsManager({
    extensions: [BaseSchemaE(), BlockquoteE(), YfmTableE()],
}).buildDeps();

const {doc, p, bq, table, tbody, tr, td} = builders(schema, {
    doc: {nodeType: BaseNode.Doc},
    p: {nodeType: BaseNode.Paragraph},
    bq: {nodeType: blockquote},
    table: {nodeType: YfmTableNode.Table},
    tbody: {nodeType: YfmTableNode.Body},
    tr: {nodeType: YfmTableNode.Row},
    td: {nodeType: YfmTableNode.Cell},
}) as PMTestBuilderResult<'doc' | 'p' | 'bq' | 'table' | 'tbody' | 'tr' | 'td'>;

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
});
