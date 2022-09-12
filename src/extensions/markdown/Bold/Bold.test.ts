import MarkdownIt from 'markdown-it';
import {builders} from 'prosemirror-test-builder';
import {createMarkupChecker} from '../../../../tests/sameMarkup';
import {ExtensionsManager} from '../../../core';
import {BaseNode, BaseSchemaE} from '../../base/BaseSchema';
import {bold, BoldE} from './index';

const {schema, parser, serializer} = new ExtensionsManager({
    md: new MarkdownIt('commonmark'),
    extensions: [BaseSchemaE(), BoldE()],
}).buildDeps();

const {doc, p, b} = builders(schema, {
    doc: {nodeType: BaseNode.Doc},
    p: {nodeType: BaseNode.Paragraph},
    b: {nodeType: bold},
}) as PMTestBuilderResult<'doc' | 'p', 'b'>;

const {same} = createMarkupChecker({parser, serializer});

describe('Bold extension', () => {
    it('should parse bold **', () => same('**hello!**', doc(p(b('hello!')))));

    it.skip('should parse bold __', () => same('__hello!__', doc(p(b('hello!')))));

    it('should parse bold inside text', () =>
        same('he**llo wor**ld!', doc(p('he', b('llo wor'), 'ld!'))));
});
