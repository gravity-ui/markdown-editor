import {builders} from 'prosemirror-test-builder';
import {createMarkupChecker} from '../../../../tests/sameMarkup';
import {ExtensionsManager} from '../../../core';
import {BaseNode, BaseSchemaE} from '../../base/BaseSchema';
import {ColorE} from './index';
import {color} from './const';

const {schema, parser, serializer} = new ExtensionsManager({
    extensions: [BaseSchemaE(), ColorE()],
}).buildDeps();

const {doc, p, c1, c2} = builders(schema, {
    doc: {nodeType: BaseNode.Doc},
    p: {nodeType: BaseNode.Paragraph},
    c1: {nodeType: color, [color]: 'c1'},
    c2: {nodeType: color, [color]: 'c2'},
}) as PMTestBuilderResult<'doc' | 'p', 'c1' | 'c2'>;

const {same} = createMarkupChecker({parser, serializer});

describe('Color extension', () => {
    it('should parse color', () => same('{c1}(hello!)', doc(p(c1('hello!')))));

    it('should parse code inside text', () =>
        same('he{c2}(llo wor)ld!', doc(p('he', c2('llo wor'), 'ld!'))));
});
