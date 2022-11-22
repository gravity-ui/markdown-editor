import {builders} from 'prosemirror-test-builder';
import {createMarkupChecker} from '../../../../tests/sameMarkup';
import {parseDOM} from '../../../../tests/parse-dom';
import {ExtensionsManager} from '../../../core';
import {BaseNode, BaseSchema} from '../../base/BaseSchema';
import {monospace, Monospace} from './index';

const {schema, parser, serializer} = new ExtensionsManager({
    extensions: (builder) => builder.use(BaseSchema, {}).use(Monospace),
}).buildDeps();

const {doc, p, m} = builders(schema, {
    doc: {nodeType: BaseNode.Doc},
    p: {nodeType: BaseNode.Paragraph},
    m: {markType: monospace},
}) as PMTestBuilderResult<'doc' | 'p', 'm'>;

const {same} = createMarkupChecker({parser, serializer});

describe('Monospace extension', () => {
    it('should parse monospace', () => same('##hello!##', doc(p(m('hello!')))));

    it('should parse monospace inside text', () =>
        same('he##llo wor##ld!', doc(p('he', m('llo wor'), 'ld!'))));

    it('should parse html - samp tag', () => {
        parseDOM(schema, '<samp>hello world!</samp>', doc(p(m('hello world!'))));
    });
});
