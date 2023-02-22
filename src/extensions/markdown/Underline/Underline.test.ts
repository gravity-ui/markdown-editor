import {builders} from 'prosemirror-test-builder';
import {createMarkupChecker} from '../../../../tests/sameMarkup';
import {parseDOM} from '../../../../tests/parse-dom';
import {ExtensionsManager} from '../../../core';
import {BaseNode, BaseSpecsPreset} from '../../base/specs';
import {underlineMarkName, UnderlineSpecs} from './UnderlineSpecs';

const {schema, parser, serializer} = new ExtensionsManager({
    extensions: (builder) => builder.use(BaseSpecsPreset, {}).use(UnderlineSpecs),
}).buildDeps();

const {doc, p, u} = builders(schema, {
    doc: {nodeType: BaseNode.Doc},
    p: {nodeType: BaseNode.Paragraph},
    u: {markType: underlineMarkName},
}) as PMTestBuilderResult<'doc' | 'p', 'u'>;

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
