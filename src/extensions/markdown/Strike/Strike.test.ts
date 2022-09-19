import {builders} from 'prosemirror-test-builder';
import {createMarkupChecker} from '../../../../tests/sameMarkup';
import {ExtensionsManager} from '../../../core';
import {BaseNode, BaseSchemaE} from '../../base/BaseSchema';
import {strike, StrikeE} from './index';

const {schema, parser, serializer} = new ExtensionsManager({
    extensions: [BaseSchemaE(), StrikeE()],
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
});
