import {builders} from 'prosemirror-test-builder';
import {createMarkupChecker} from '../../../../tests/sameMarkup';
import {parseDOM} from '../../../../tests/parse-dom';
import {ExtensionsManager} from '../../../core';
import {BaseNode, BaseSchema} from '../../base/BaseSchema';
import {subscript, Subscript} from './index';

const {schema, parser, serializer} = new ExtensionsManager({
    extensions: (builder) => builder.use(BaseSchema, {}).use(Subscript, {}),
}).buildDeps();

const {doc, p, s} = builders(schema, {
    doc: {nodeType: BaseNode.Doc},
    p: {nodeType: BaseNode.Paragraph},
    s: {markType: subscript},
}) as PMTestBuilderResult<'doc' | 'p', 's'>;

const {same} = createMarkupChecker({parser, serializer});

describe('Subscript extension', () => {
    it('should parse subscript', () => same('~hello~', doc(p(s('hello')))));

    it('should parse subscript inside text', () =>
        same('hello~world~!', doc(p('hello', s('world'), '!'))));

    it('should parse html - sub tag', () => {
        parseDOM(schema, '<p><sub>subscript</sub></p>', doc(p(s('subscript'))));
    });
});
