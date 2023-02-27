import {builders} from 'prosemirror-test-builder';
import {createMarkupChecker} from '../../../../tests/sameMarkup';
import {parseDOM} from '../../../../tests/parse-dom';
import {ExtensionsManager} from '../../../core';
import {BaseNode, BaseSpecsPreset} from '../../base/specs';
import {monospaceMarkName, MonospaceSpecs} from './MonospaceSpecs';

const {schema, parser, serializer} = new ExtensionsManager({
    extensions: (builder) => builder.use(BaseSpecsPreset, {}).use(MonospaceSpecs),
}).buildDeps();

const {doc, p, m} = builders(schema, {
    doc: {nodeType: BaseNode.Doc},
    p: {nodeType: BaseNode.Paragraph},
    m: {markType: monospaceMarkName},
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
