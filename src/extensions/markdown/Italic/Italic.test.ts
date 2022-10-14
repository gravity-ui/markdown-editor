import {builders} from 'prosemirror-test-builder';
import {createMarkupChecker} from '../../../../tests/sameMarkup';
import {ExtensionsManager} from '../../../core';
import {BaseNode, BaseSchema} from '../../base/BaseSchema';
import {italic, Italic} from './index';

const {schema, parser, serializer} = new ExtensionsManager({
    extensions: (builder) => builder.use(BaseSchema, {}).use(Italic, {}),
}).buildDeps();

const {doc, p, i} = builders(schema, {
    doc: {nodeType: BaseNode.Doc},
    p: {nodeType: BaseNode.Paragraph},
    i: {markType: italic},
}) as PMTestBuilderResult<'doc' | 'p', 'i'>;

const {same} = createMarkupChecker({parser, serializer});

describe('Italic extension', () => {
    it('should parse italic *', () => same('*hello!*', doc(p(i('hello!')))));

    it.skip('should parse italic _', () => same('_hello!_', doc(p(i('hello!')))));

    it('should parse italic inside text', () =>
        same('he*llo wor*ld!', doc(p('he', i('llo wor'), 'ld!'))));
});
