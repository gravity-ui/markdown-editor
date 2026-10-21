import MarkdownIt from 'markdown-it';
import {builders} from 'prosemirror-test-builder';
import {describe, expect, it} from 'vitest';

import {createMarkupChecker} from '../../../../tests/sameMarkup';
import {ExtensionsManager} from '../../../core';
import {BaseNode, BaseSchemaSpecs} from '../../base/specs';
import {BlockquoteSpecs, blockquoteNodeName} from '../../markdown/specs';

import {
    HeaderAttr,
    HeaderHeight,
    HeaderSpecs,
    headerDirective,
    headerNodeName,
} from './HeaderSpecs';

const {schema, markupParser, serializer} = new ExtensionsManager({
    extensions: (builder) => builder.use(BaseSchemaSpecs, {}).use(BlockquoteSpecs).use(HeaderSpecs),
}).buildDeps();

const {doc, p, bq} = builders<'doc' | 'p' | 'bq'>(schema, {
    doc: {nodeType: BaseNode.Doc},
    p: {nodeType: BaseNode.Paragraph},
    bq: {nodeType: blockquoteNodeName},
});

const header = (height: HeaderHeight) => schema.node(headerNodeName, {[HeaderAttr.Height]: height});

const {same, parse} = createMarkupChecker({parser: markupParser, serializer});

const md = new MarkdownIt().use(headerDirective);

describe('Header', () => {
    it.each(Object.values(HeaderHeight))('should keep the height %s', (height) => {
        same(`:::header{height=${height}}\n\n:::`, doc(header(height)));
    });

    it.each([
        ['no attributes', ':::header\n:::'],
        ['an unknown height', ':::header{height=xl}\n:::'],
    ])('should use the default height for %s', (_name, markup) => {
        parse(markup, doc(header(HeaderHeight.S)));
    });

    it('should drop the content', () => {
        parse(':::header{height=m}\nText\n:::', doc(header(HeaderHeight.M)));
    });

    it('should keep the blank line inside a quote without trailing spaces', () => {
        same('> :::header{height=l}\n>\n> :::', doc(bq(header(HeaderHeight.L))));
    });

    it('should separate the block from a paragraph', () => {
        same(':::header{height=s}\n\n:::\n\nText', doc(header(HeaderHeight.S), p('Text')));
    });

    it('should render an empty block with the height modifier', () => {
        expect(md.render(':::header{height=m}\nText\n:::')).toBe(
            '<div class="g-md-header g-md-header_height_m" data-height="m"></div>\n',
        );
    });
});
