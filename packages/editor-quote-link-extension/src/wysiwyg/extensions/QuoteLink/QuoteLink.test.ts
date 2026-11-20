// @vitest-environment jsdom
import {ExtensionsManager} from '@gravity-ui/markdown-editor/core';
import {DOMParser, type Node} from '@gravity-ui/markdown-editor/pm/model';
import {builders} from '@gravity-ui/markdown-editor/pm/test-builder';
import {
    BaseNode,
    BaseSchemaSpecs,
    BlockquoteSpecs,
    YfmConfigsSpecs,
} from '@gravity-ui/markdown-editor/specs';
import dd from 'ts-dedent';
import {describe, expect, it} from 'vitest';

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

function same(text: string, node: Node) {
    expect(parser.parse(text).toJSON()).toEqual(node.toJSON());
    expect(serializer.serialize(node)).toBe(text);
}

function parseDOM(html: string, node: Node) {
    const container = document.createElement('div');
    container.innerHTML = html;
    expect(DOMParser.fromSchema(schema).parse(container).toJSON()).toEqual(node.toJSON());
}

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
            dd`<div>
                    <blockquote class="yfm-quote-link" cite="https://ya.ru" data-content="Quote link">
                        <p>quote link text</p>
                    </blockquote>
            </div>`,
            doc(quoteLink(p('quote link text'))),
        );
    });
});
