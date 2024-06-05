import {builders} from 'prosemirror-test-builder';

import {parseDOM} from '../../../../tests/parse-dom';
import {createMarkupChecker} from '../../../../tests/sameMarkup';
import {ExtensionsManager} from '../../../core';
import {BaseNode, BaseSpecsPreset} from '../../base/specs';

import {UnderlineSpecs, underlineMarkName} from './UnderlineSpecs';

const {
    schema,
    markupParser: parser,
    serializer,
} = new ExtensionsManager({
    extensions: (builder) => builder.use(BaseSpecsPreset, {}).use(UnderlineSpecs),
}).buildDeps();

const {doc, p, u} = builders<'doc' | 'p', 'u'>(schema, {
    doc: {nodeType: BaseNode.Doc},
    p: {nodeType: BaseNode.Paragraph},
    u: {markType: underlineMarkName},
});

const {same} = createMarkupChecker({parser, serializer});

describe('Underline extension', () => {
    it('should parse underline', () => same('++hello!++', doc(p(u('hello!')))));

    it('should parse underline inside text', () =>
        same('he++llo wor++ld!', doc(p('he', u('llo wor'), 'ld!'))));

    it('should parse html - ins tag', () => {
        parseDOM(schema, '<p><ins>underline</ins></p>', doc(p(u('underline'))));
    });

    it('should parse html - u tag', () => {
        parseDOM(schema, '<div><u>underline</u></div>', doc(p(u('underline'))));
    });
});
