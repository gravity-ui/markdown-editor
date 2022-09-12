import MarkdownIt from 'markdown-it';
import {builders} from 'prosemirror-test-builder';
import {createMarkupChecker} from '../../../../tests/sameMarkup';
import {ExtensionsManager} from '../../../core';
import {BaseNode, BaseSchemaE} from '../../base/BaseSchema';
import {underline, UnderlineE} from './index';

const {schema, parser, serializer} = new ExtensionsManager({
    md: new MarkdownIt('commonmark'),
    extensions: [BaseSchemaE(), UnderlineE()],
}).buildDeps();

const {doc, p, u} = builders(schema, {
    doc: {nodeType: BaseNode.Doc},
    p: {nodeType: BaseNode.Paragraph},
    u: {markType: underline},
}) as PMTestBuilderResult<'doc' | 'p', 'u'>;

const {same} = createMarkupChecker({parser, serializer});

describe('Underline extension', () => {
    it('should parse underline', () => same('++hello!++', doc(p(u('hello!')))));

    it('should parse underline inside text', () =>
        same('he++llo wor++ld!', doc(p('he', u('llo wor'), 'ld!'))));
});
