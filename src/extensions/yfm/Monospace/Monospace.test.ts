import {builders} from 'prosemirror-test-builder';

import {parseDOM} from '../../../../tests/parse-dom';
import {createMarkupChecker} from '../../../../tests/sameMarkup';
import {ExtensionsManager} from '../../../core';
import {BaseNode, BaseSpecsPreset} from '../../base/specs';

import {MonospaceSpecs, monospaceMarkName} from './MonospaceSpecs';

const {schema, parser, serializer} = new ExtensionsManager({
    extensions: (builder) => builder.use(BaseSpecsPreset, {}).use(MonospaceSpecs),
}).buildDeps();

const {doc, p, m} = builders<'doc' | 'p', 'm'>(schema, {
    doc: {nodeType: BaseNode.Doc},
    p: {nodeType: BaseNode.Paragraph},
    m: {markType: monospaceMarkName},
});

const {same} = createMarkupChecker({parser, serializer});

describe('Monospace extension', () => {
    it('should parse monospace', () => same('##hello!##', doc(p(m('hello!')))));

    it('should parse monospace inside text', () =>
        same('he##llo wor##ld!', doc(p('he', m('llo wor'), 'ld!'))));

    it('should parse html - samp tag', () => {
        parseDOM(schema, '<samp>hello world!</samp>', doc(p(m('hello world!'))));
    });
});
