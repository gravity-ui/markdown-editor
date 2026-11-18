// @vitest-environment jsdom
import {EditorState as MarkupEditorState} from '@gravity-ui/markdown-editor/cm/state';
import {ExtensionsManager} from '@gravity-ui/markdown-editor/core';
import {DOMParser} from '@gravity-ui/markdown-editor/pm/model';
import {EditorState, TextSelection, type Transaction} from '@gravity-ui/markdown-editor/pm/state';
import {builders} from '@gravity-ui/markdown-editor/pm/test-builder';
import {
    BaseNode,
    BaseSchemaSpecs,
    BlockquoteSpecs,
    LinkSpecs,
    YfmConfigsSpecs,
    blockquoteNodeName,
} from '@gravity-ui/markdown-editor/specs';
import dd from 'ts-dedent';
import {describe, expect, it} from 'vitest';

import {insertBlockquoteLink} from '../../../markup/commands/insertBlockquoteLink';

import {QuoteLinkAttr, QuoteLinkSpecs, quoteLinkNodeName} from './QuoteLinkSpecs';
import {toggleQuote} from './commands';

const {
    schema,
    markupParser: parser,
    serializer,
} = new ExtensionsManager({
    extensions: (builder) =>
        builder
            .use(BaseSchemaSpecs, {})
            .use(YfmConfigsSpecs, {attrs: {allowedAttributes: ['data-quotelink', 'data-content']}})
            .use(LinkSpecs)
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

function parseHtml(html: string) {
    const container = document.createElement('div');
    container.innerHTML = html;
    return DOMParser.fromSchema(schema).parse(container);
}

describe('QuoteLink extension', () => {
    it('should parse a quote link', () => {
        const markup = dd`
            > [Quote link](https://ya.ru){data-quotelink=true}
            >${' '}
            > quote link text
            `;
        const expected = doc(quoteLink(p('quote link text')));
        expect(parser.parse(markup).toJSON()).toEqual(expected.toJSON());
        expect(serializer.serialize(expected)).toBe(markup);
    });

    it('should parse html - blockquote tag with quote link class', () => {
        const parsed = parseHtml(dd`
            <blockquote class="yfm-quote-link" cite="https://ya.ru" data-content="Quote link">
                <p>quote link text</p>
            </blockquote>
        `);
        expect(parsed.toJSON()).toEqual(doc(quoteLink(p('quote link text'))).toJSON());
    });

    it('should keep a regular link in a regular blockquote', () => {
        const parsed = parser.parse('> [text](https://ya.ru)');
        expect(parsed.firstChild?.type.name).toBe(blockquoteNodeName);
    });

    it('should insert markup that parses into a quote link', () => {
        let markup = '';
        insertBlockquoteLink({
            state: MarkupEditorState.create(),
            dispatch: (tr) => {
                markup = tr.state.doc.toString();
            },
        });
        const parsed = parser.parse(markup);
        expect(parsed.firstChild?.type.name).toBe(quoteLinkNodeName);
        expect(parsed.firstChild?.attrs).toMatchObject({
            [QuoteLinkAttr.Cite]: 'url',
            [QuoteLinkAttr.DataContent]: 'link',
        });
    });

    it('should wrap the paragraph in a quote link and lift it back', () => {
        let state = EditorState.create({schema, doc: doc(p('text'))});
        state = state.apply(state.tr.setSelection(TextSelection.create(state.doc, 2)));
        const dispatch = (tr: Transaction) => {
            state = state.apply(tr);
        };

        expect(toggleQuote(state, dispatch)).toBe(true);
        expect(state.doc.firstChild?.type.name).toBe(quoteLinkNodeName);

        expect(toggleQuote(state, dispatch)).toBe(true);
        expect(state.doc.toJSON()).toEqual(doc(p('text')).toJSON());
    });
});
