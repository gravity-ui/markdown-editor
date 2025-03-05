import {builders} from 'prosemirror-test-builder';
import dd from 'ts-dedent';

import {ExtensionsManager} from '#core';
import {LinkAttr, linkMarkName} from 'src/extensions';
import {BlockquoteSpecs} from 'src/extensions/markdown/Blockquote/BlockquoteSpecs';
import {LinkSpecs} from 'src/extensions/markdown/Link/LinkSpecs';
import {YfmConfigsSpecs} from 'src/extensions/yfm/YfmConfigs/YfmConfigsSpecs';

import {parseDOM} from '../../../../tests/parse-dom';
import {createMarkupChecker} from '../../../../tests/sameMarkup';
import {BaseNode, BaseSchemaSpecs} from '../../base/specs';

import {QuoteLinkSpecs, quoteLinkNodeName} from './QuoteLinkSpecs';

const {
    schema,
    markupParser: parser,
    serializer,
} = new ExtensionsManager({
    extensions: (builder) =>
        builder
            .use(BaseSchemaSpecs, {})
            .use(YfmConfigsSpecs, {attrs: {allowedAttributes: ['data-quotelink']}})
            .use(BlockquoteSpecs)
            .use(LinkSpecs)
            .use(QuoteLinkSpecs),
}).buildDeps();

const {doc, p, q, a} = builders<'doc' | 'p' | 'q' | 'a'>(schema, {
    doc: {nodeType: BaseNode.Doc},
    p: {nodeType: BaseNode.Paragraph},
    q: {nodeType: quoteLinkNodeName},
    a: {nodeType: linkMarkName, [LinkAttr.Href]: 'https://ya.ru', [LinkAttr.DataQuoteLink]: 'true'},
});

const {same} = createMarkupChecker({parser, serializer});

describe('QuoteLink extension', () => {
    it('should parse a quote link', () =>
        same(
            dd`
            > [Quote link](https://ya.ru){data-quotelink=true}
            >
            > quote link text
            `,
            doc(q(p(a('Quote link')), p('quote link text'))),
        ));

    it('should parse html - blockquote tag with quote link class', () => {
        parseDOM(
            schema,
            dd`<div>
                    <blockquote class="yfm-quote-link">
                        <p>
                          <a href="https://ya.ru" data-quotelink="true">Quote link</a>
                        </p>
                        <p>quote link text</p>
                    </blockquote>
            </div>`,
            doc(q(p(a('Quote link')), p('quote link text'))),
        );
    });
});
