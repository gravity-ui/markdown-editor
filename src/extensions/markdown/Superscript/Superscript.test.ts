import {builders} from 'prosemirror-test-builder';
import {createMarkupChecker} from '../../../../tests/sameMarkup';
import {parseDOM} from '../../../../tests/parse-dom';
import {ExtensionsManager} from '../../../core';
import {BaseNode, BaseSchema} from '../../base/BaseSchema';
import {superscript, Superscript} from './index';

const {schema, parser, serializer} = new ExtensionsManager({
    extensions: (builder) => builder.use(BaseSchema, {}).use(Superscript, {}),
}).buildDeps();

const {doc, p, s} = builders(schema, {
    doc: {nodeType: BaseNode.Doc},
    p: {nodeType: BaseNode.Paragraph},
    s: {markType: superscript},
}) as PMTestBuilderResult<'doc' | 'p', 's'>;

const {same} = createMarkupChecker({parser, serializer});

describe('Superscript extension', () => {
    it('should parse superscript', () => same('^hello^', doc(p(s('hello')))));

    it('should parse superscript inside text', () =>
        same('hello^world^!', doc(p('hello', s('world'), '!'))));

    it('should parse html - sup tag', () => {
        parseDOM(schema, '<p><sup>superscript</sup></p>', doc(p(s('superscript'))));
    });
});
