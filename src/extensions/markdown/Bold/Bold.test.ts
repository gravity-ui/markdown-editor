import {builders} from 'prosemirror-test-builder';
import {createMarkupChecker} from '../../../../tests/sameMarkup';
import {ExtensionsManager} from '../../../core';
import {BaseNode, BaseSchema} from '../../base/BaseSchema';
import {bold, Bold} from './index';

const {schema, parser, serializer} = new ExtensionsManager({
    extensions: (builder) => builder.use(BaseSchema, {}).use(Bold, {}),
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
