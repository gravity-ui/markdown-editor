import {builders} from 'prosemirror-test-builder';
import {createMarkupChecker} from '../../../../tests/sameMarkup';
import {parseDOM} from '../../../../tests/parse-dom';
import {ExtensionsManager} from '../../../core';
import {BaseNode, BaseSpecsPreset} from '../../base/specs';
import {subscriptMarkName, SubscriptSpecs} from './SubscriptSpecs';

const {schema, parser, serializer} = new ExtensionsManager({
    extensions: (builder) => builder.use(BaseSpecsPreset, {}).use(SubscriptSpecs),
}).buildDeps();

const {doc, p, s} = builders(schema, {
    doc: {nodeType: BaseNode.Doc},
    p: {nodeType: BaseNode.Paragraph},
    s: {markType: subscriptMarkName},
}) as PMTestBuilderResult<'doc' | 'p', 's'>;

const {same} = createMarkupChecker({parser, serializer});

describe('Subscript extension', () => {
    it('should parse subscript', () => same('~hello~', doc(p(s('hello')))));

    it('should parse subscript inside text', () =>
        same('hello~world~!', doc(p('hello', s('world'), '!'))));

    it('should parse html - sub tag', () => {
        parseDOM(schema, '<p><sub>subscript</sub></p>', doc(p(s('subscript'))));
    });

    it('should escape whitespaces', () => {
        same(
            'Ok, hello~w\\ o\\ r\\ l\\ d~! This world is beautiful!',
            doc(p('Ok, hello', s('w o r l d'), '! This world is beautiful!')),
        );
    });
});
