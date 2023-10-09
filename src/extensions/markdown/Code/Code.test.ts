import {builders} from 'prosemirror-test-builder';
import {createMarkupChecker} from '../../../../tests/sameMarkup';
import {parseDOM} from '../../../../tests/parse-dom';
import {ExtensionsManager} from '../../../core';
import {BaseNode, BaseSpecsPreset} from '../../base/specs';
import {boldMarkName, BoldSpecs} from '../Bold/BoldSpecs';
import {italicMarkName, ItalicSpecs} from '../Italic/ItalicSpecs';
import {codeMarkName, CodeSpecs} from './CodeSpecs';

const {schema, parser, serializer} = new ExtensionsManager({
    extensions: (builder) =>
        builder.use(BaseSpecsPreset, {}).use(BoldSpecs).use(CodeSpecs).use(ItalicSpecs),
}).buildDeps();

const {doc, p, b, i, c} = builders(schema, {
    doc: {nodeType: BaseNode.Doc},
    p: {nodeType: BaseNode.Paragraph},
    b: {nodeType: boldMarkName},
    i: {nodeType: italicMarkName},
    c: {nodeType: codeMarkName},
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

    it('should parse html - code tag', () => {
        parseDOM(schema, '<code>code inline</code>', doc(p(c('code inline'))));
    });

    it('should parse new line in code', () => {
        same('`\\n`', doc(p(c('\\n'))));
    });
});
