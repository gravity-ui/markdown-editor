import {EditorState} from 'prosemirror-state';
import {builders} from 'prosemirror-test-builder';
import {EditorView} from 'prosemirror-view';

import {dispatchPasteEvent} from '../../../../tests/dispatch-event';
import {parseDOM} from '../../../../tests/parse-dom';
import {createMarkupChecker} from '../../../../tests/sameMarkup';
import {ExtensionsManager} from '../../../core';
import {BaseNode, BaseSpecsPreset} from '../../base/specs';
import {BlockquoteSpecs, blockquoteNodeName} from '../../markdown/Blockquote/BlockquoteSpecs';

import {YfmTableNode, YfmTableSpecs} from './YfmTableSpecs';
import {fixPastedTableBodies} from './paste';

const {schema, parser, serializer} = new ExtensionsManager({
    extensions: (builder) =>
        builder.use(BaseSpecsPreset, {}).use(BlockquoteSpecs).use(YfmTableSpecs, {}),
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
});
