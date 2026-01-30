import {builders} from 'prosemirror-test-builder';
import dd from 'ts-dedent';

import {ExtensionsManager} from '#core';
import {BlockquoteSpecs} from 'src/extensions/markdown/Blockquote/BlockquoteSpecs';
import {YfmConfigsSpecs} from 'src/extensions/yfm/YfmConfigs/YfmConfigsSpecs';

import {parseDOM} from '../../../../tests/parse-dom';
import {createMarkupChecker} from '../../../../tests/sameMarkup';
import {BaseNode, BaseSchemaSpecs} from '../../base/specs';

import {QuoteLinkAttr, QuoteLinkSpecs, quoteLinkNodeName} from './QuoteLinkSpecs';

const {
    schema,
    markupParser: parser,
    serializer,
} = new ExtensionsManager({
    extensions: (builder) =>
        builder
            .use(BaseSchemaSpecs, {})
            .use(YfmConfigsSpecs, {attrs: {allowedAttributes: ['data-quotelink', 'data-content']}})
            .use(BlockquoteSpecs)
            .use(QuoteLinkSpecs),
}).buildDeps();

const {doc, p, quoteLink} = builders<'doc' | 'p' | 'quoteLink'>(schema, {
    doc: {nodeType: BaseNode.Doc},
    p: {nodeType: BaseNode.Paragraph},
    quoteLink: {
        nodeType: quoteLinkNodeName,
        [QuoteLinkAttr.Cite]: 'https://ya.ru',
        [QuoteLinkAttr.DataContent]: 'Quote link',
    },
});

const {same} = createMarkupChecker({parser, serializer});

describe('QuoteLink extension', () => {
    it('should parse a quote link', () =>
        same(
            dd`
            > [Quote link](https://ya.ru){data-quotelink=true}
            >${' '}
            > quote link text
            `,
            doc(quoteLink(p('quote link text'))),
        ));

    it('should parse html - blockquote tag with quote link class', () => {
        parseDOM(
            schema,
            dd`<div>
                    <blockquote class="yfm-quote-link" cite="https://ya.ru" data-content="Quote link">
                        <p>quote link text</p>
                    </blockquote>
            </div>`,
            doc(quoteLink(p('quote link text'))),
        );
    });
});
