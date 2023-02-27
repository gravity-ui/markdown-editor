import {builders} from 'prosemirror-test-builder';
import {createMarkupChecker} from '../../../../tests/sameMarkup';
import {ExtensionsManager} from '../../../core';
import {BaseNode, BaseSpecsPreset} from '../../base/specs';
import {colorMarkName, ColorSpecs} from './ColorSpecs';

const {schema, parser, serializer} = new ExtensionsManager({
    extensions: (builder) => builder.use(BaseSpecsPreset, {}).use(ColorSpecs),
}).buildDeps();

const {doc, p, c1, c2} = builders(schema, {
    doc: {nodeType: BaseNode.Doc},
    p: {nodeType: BaseNode.Paragraph},
    c1: {nodeType: colorMarkName, [colorMarkName]: 'c1'},
    c2: {nodeType: colorMarkName, [colorMarkName]: 'c2'},
}) as PMTestBuilderResult<'doc' | 'p', 'c1' | 'c2'>;

const {same} = createMarkupChecker({parser, serializer});

describe('Color extension', () => {
    it('should parse color', () => same('{c1}(hello!)', doc(p(c1('hello!')))));

    it('should parse code inside text', () =>
        same('he{c2}(llo wor)ld!', doc(p('he', c2('llo wor'), 'ld!'))));
});
