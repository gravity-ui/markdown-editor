import MarkdownIt from 'markdown-it';
import {builders} from 'prosemirror-test-builder';
import {createMarkupChecker} from '../../../../tests/sameMarkup';
import {ExtensionsManager} from '../../../core';
import {BaseNode, BaseSchemaE} from '../../base/BaseSchema';
import {code, CodeE} from './index';

const {schema, parser, serializer} = new ExtensionsManager({
    md: new MarkdownIt('commonmark'),
    extensions: [BaseSchemaE(), CodeE()],
}).buildDeps();

const {doc, p, c} = builders(schema, {
    doc: {nodeType: BaseNode.Doc},
    p: {nodeType: BaseNode.Paragraph},
    c: {nodeType: code},
}) as PMTestBuilderResult<'doc' | 'p', 'c'>;

const {same} = createMarkupChecker({parser, serializer});

describe('Code extension', () => {
    it('should parse code', () => same('`hello!`', doc(p(c('hello!')))));

    it('should parse code inside text', () =>
        same('he`llo wor`ld!', doc(p('he', c('llo wor'), 'ld!'))));
});
