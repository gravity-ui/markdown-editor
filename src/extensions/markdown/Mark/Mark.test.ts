import {builders} from 'prosemirror-test-builder';

import {parseDOM} from '../../../../tests/parse-dom';
import {createMarkupChecker} from '../../../../tests/sameMarkup';
import {ExtensionsManager} from '../../../core';
import {BaseNode, BaseSpecsPreset} from '../../base/specs';

import {MarkSpecs, markMarkName} from './MarkSpecs';

const {schema, parser, serializer} = new ExtensionsManager({
    extensions: (builder) => builder.use(BaseSpecsPreset, {}).use(MarkSpecs),
}).buildDeps();

const {doc, p, m} = builders<'doc' | 'p', 'm'>(schema, {
    doc: {nodeType: BaseNode.Doc},
    p: {nodeType: BaseNode.Paragraph},
    m: {markType: markMarkName},
});

const {same} = createMarkupChecker({parser, serializer});

describe('Mark extension', () => {
    it('should parse mark', () => same('==hello!==', doc(p(m('hello!')))));

    it('should parse mark inside text', () =>
        same('he==llo wor==ld!', doc(p('he', m('llo wor'), 'ld!'))));

    it('should parse html - sub tag', () => {
        parseDOM(schema, '<p><mark>marked text</mark></p>', doc(p(m('marked text'))));
    });
});
