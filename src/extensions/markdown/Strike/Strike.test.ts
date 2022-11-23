import {builders} from 'prosemirror-test-builder';
import {createMarkupChecker} from '../../../../tests/sameMarkup';
import {parseDOM} from '../../../../tests/parse-dom';
import {ExtensionsManager} from '../../../core';
import {BaseNode, BaseSchema} from '../../base/BaseSchema';
import {strike, Strike} from './index';

const {schema, parser, serializer} = new ExtensionsManager({
    extensions: (builder) => builder.use(BaseSchema, {}).use(Strike, {}),
}).buildDeps();

const {doc, p, s} = builders(schema, {
    doc: {nodeType: BaseNode.Doc},
    p: {nodeType: BaseNode.Paragraph},
    s: {markType: strike},
}) as PMTestBuilderResult<'doc' | 'p', 's'>;

const {same} = createMarkupChecker({parser, serializer});

describe('Strike extension', () => {
    it('should parse strike', () => same('~~hello!~~', doc(p(s('hello!')))));

    it('should parse strike inside text', () =>
        same('he~~llo wor~~ld!', doc(p('he', s('llo wor'), 'ld!'))));

    it('should parse html - strike tag', () => {
        parseDOM(schema, '<p><strike>strikethrough</strike></p>', doc(p(s('strikethrough'))));
    });

    it('should parse html - s tag', () => {
        parseDOM(schema, '<div><s>strikethrough</s></div>', doc(p(s('strikethrough'))));
    });
});
