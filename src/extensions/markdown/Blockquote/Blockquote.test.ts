import MarkdownIt from 'markdown-it';
import {builders} from 'prosemirror-test-builder';
import {createMarkupChecker} from '../../../../tests/sameMarkup';
import {ExtensionsManager} from '../../../core';
import {BaseNode, BaseSchemaE} from '../../base/BaseSchema';
import {blockquote, BlockquoteE} from './index';

const {schema, parser, serializer} = new ExtensionsManager({
    md: new MarkdownIt('commonmark'),
    extensions: [BaseSchemaE(), BlockquoteE()],
}).buildDeps();

const {doc, p, q} = builders(schema, {
    doc: {nodeType: BaseNode.Doc},
    p: {nodeType: BaseNode.Paragraph},
    q: {nodeType: blockquote},
}) as PMTestBuilderResult<'doc' | 'p' | 'q'>;

const {same} = createMarkupChecker({parser, serializer});

describe('Blockquote extension', () => {
    it('should parse a blockquote', () => same('> hello!', doc(q(p('hello!')))));

    it('should parse a nested blockquote', () => same('> > hello!', doc(q(q(p('hello!'))))));

    it('should parse a blockquote with few paragraphs', () => {
        same(['> hello', '>', '> world!'].join('\n'), doc(q(p('hello'), p('world!'))));
    });
});
