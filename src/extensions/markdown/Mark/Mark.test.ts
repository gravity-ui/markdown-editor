import {builders} from 'prosemirror-test-builder';
import {createMarkupChecker} from '../../../../tests/sameMarkup';
import {ExtensionsManager} from '../../../core';
import {BaseNode, BaseSchemaE} from '../../base/BaseSchema';
import {mark, MarkE} from './index';

const {schema, parser, serializer} = new ExtensionsManager({
    extensions: [BaseSchemaE(), MarkE()],
}).buildDeps();

const {doc, p, m} = builders(schema, {
    doc: {nodeType: BaseNode.Doc},
    p: {nodeType: BaseNode.Paragraph},
    m: {markType: mark},
}) as PMTestBuilderResult<'doc' | 'p', 'm'>;

const {same} = createMarkupChecker({parser, serializer});

describe('Mark extension', () => {
    it('should parse mark', () => same('==hello!==', doc(p(m('hello!')))));

    it('should parse mark inside text', () =>
        same('he==llo wor==ld!', doc(p('he', m('llo wor'), 'ld!'))));
});
