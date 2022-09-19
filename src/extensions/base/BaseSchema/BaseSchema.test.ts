import {builders} from 'prosemirror-test-builder';
import {createMarkupChecker} from '../../../../tests/sameMarkup';
import {ExtensionsManager} from '../../../core';
import {BaseNode, BaseSchemaE} from './index';

const {schema, parser, serializer} = new ExtensionsManager({
    extensions: [BaseSchemaE()],
}).buildDeps();

const {doc, p} = builders(schema, {
    doc: {nodeType: BaseNode.Doc},
    p: {nodeType: BaseNode.Paragraph},
}) as PMTestBuilderResult<'doc' | 'p'>;

const {same} = createMarkupChecker({parser, serializer});

describe('BaseSchema extension', () => {
    it('should parse a paragraph', () => same('hello!', doc(p('hello!'))));

    it('should parse a few paragraphs', () => {
        same(['hello', '', 'world!'].join('\n'), doc(p('hello'), p('world!')));
    });
});
