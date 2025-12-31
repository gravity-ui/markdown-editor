import {builders} from 'prosemirror-test-builder';

import {parseDOM} from '../../../../tests/parse-dom';
import {createMarkupChecker} from '../../../../tests/sameMarkup';
import {ExtensionsManager} from '../../../core';
import {BaseNode, BaseSchemaSpecs} from '../../base/specs';

import {ItalicAttrs, ItalicSpecs, italicMarkName} from './ItalicSpecs';

const {
    schema,
    markupParser: parser,
    serializer,
} = new ExtensionsManager({
    extensions: (builder) => builder.use(BaseSchemaSpecs, {}).use(ItalicSpecs),
}).buildDeps();

const {doc, p, i} = builders<'doc' | 'p', 'i'>(schema, {
    doc: {nodeType: BaseNode.Doc},
    p: {nodeType: BaseNode.Paragraph},
    i: {markType: italicMarkName},
});

const {same} = createMarkupChecker({parser, serializer});

const astAttrs = {[ItalicAttrs.Markup]: '*'}; // asterisk
const undAttrs = {[ItalicAttrs.Markup]: '_'}; // underscore
const nullAttrs = {[ItalicAttrs.Markup]: null}; // null

describe('Italic extension', () => {
    it('should parse italic *', () => same('*hello!*', doc(p(i(astAttrs, 'hello!')))));

    it('should parse italic _', () => same('_hello!_', doc(p(i(undAttrs, 'hello!')))));

    it('should parse italic inside text', () =>
        same('he*llo wor*ld!', doc(p('he', i(astAttrs, 'llo wor'), 'ld!'))));

    it('should parse html - em tag', () => {
        parseDOM(schema, '<p><em>text in em</em></p>', doc(p(i(nullAttrs, 'text in em'))));
    });

    it('should parse html - em tag - with asterisk markup', () => {
        parseDOM(
            schema,
            '<p><em data-markup="*">text in em</em></p>',
            doc(p(i(astAttrs, 'text in em'))),
        );
    });

    it('should parse html - em tag - with underscore markup', () => {
        parseDOM(
            schema,
            '<p><em data-markup="_">text in em</em></p>',
            doc(p(i(undAttrs, 'text in em'))),
        );
    });

    it('should parse html - i tag', () => {
        parseDOM(schema, '<div><i>text in i</i></div>', doc(p(i('text in i'))));
    });

    it('should parse html - font-style:italic', () => {
        parseDOM(
            schema,
            '<div style="font-style:italic">text with styles</div>',
            doc(p(i('text with styles'))),
        );
    });
});
