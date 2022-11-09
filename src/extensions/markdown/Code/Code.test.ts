import {builders} from 'prosemirror-test-builder';
import {createMarkupChecker} from '../../../../tests/sameMarkup';
import {ExtensionsManager} from '../../../core';
import {BaseNode, BaseSchema} from '../../base/BaseSchema';
import {bold, Bold} from '../Bold';
import {italic, Italic} from '../Italic';
import {code, Code} from './index';

const {schema, parser, serializer} = new ExtensionsManager({
    extensions: (builder) =>
        builder.use(BaseSchema, {}).use(Bold, {}).use(Code, {}).use(Italic, {}),
}).buildDeps();

const {doc, p, b, i, c} = builders(schema, {
    doc: {nodeType: BaseNode.Doc},
    p: {nodeType: BaseNode.Paragraph},
    b: {nodeType: bold},
    i: {nodeType: italic},
    c: {nodeType: code},
}) as PMTestBuilderResult<'doc' | 'p', 'b' | 'i' | 'c'>;

const {same} = createMarkupChecker({parser, serializer});

describe('Code extension', () => {
    it('should parse code', () => same('`hello!`', doc(p(c('hello!')))));

    it('should parse code inside text', () =>
        same('he`llo wor`ld!', doc(p('he', c('llo wor'), 'ld!'))));

    it('should parse and serialize overlapping inline marks', () =>
        same(
            'This is **strong *emphasized text with `code` in* it**',
            doc(p('This is ', b('strong ', i('emphasized text with ', c('code'), ' in'), ' it'))),
        ));
});
