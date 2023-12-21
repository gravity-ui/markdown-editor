import {builders} from 'prosemirror-test-builder';
import {createMarkupChecker} from '../../../../tests/sameMarkup';
import {ExtensionsManager} from '../../../core';
import {BaseNode, BaseSchemaSpecs} from './BaseSchemaSpecs';

const {schema, parser, serializer} = new ExtensionsManager({
    extensions: (builder) => builder.use(BaseSchemaSpecs, {}),
}).buildDeps();

const {doc, p} = builders<'doc' | 'p'>(schema, {
    doc: {nodeType: BaseNode.Doc},
    p: {nodeType: BaseNode.Paragraph},
});

const {same} = createMarkupChecker({parser, serializer});

describe('BaseSchema extension', () => {
    it('should parse a paragraph', () => same('hello!', doc(p('hello!'))));

    it('should parse a few paragraphs', () => {
        same(['hello', '', 'world!'].join('\n'), doc(p('hello'), p('world!')));
    });
});
