import {builders} from 'prosemirror-test-builder';

import {parseDOM} from '../../../../tests/parse-dom';
import {createMarkupChecker} from '../../../../tests/sameMarkup';
import {ExtensionsManager} from '../../../core';
import {BaseNode, BaseSchemaSpecs} from '../../base/specs';

import {BoldAttrs, BoldSpecs, boldMarkName} from './BoldSpecs';

const {
    schema,
    markupParser: parser,
    serializer,
} = new ExtensionsManager({
    extensions: (builder) => builder.use(BaseSchemaSpecs, {}).use(BoldSpecs),
}).buildDeps();

const {doc, p, b} = builders<'doc' | 'p', 'b'>(schema, {
    doc: {nodeType: BaseNode.Doc},
    p: {nodeType: BaseNode.Paragraph},
    b: {nodeType: boldMarkName},
});

const {same} = createMarkupChecker({parser, serializer});

const astAttrs = {[BoldAttrs.Markup]: '**'}; // asterisk
const undAttrs = {[BoldAttrs.Markup]: '__'}; // underscore
const nullAttrs = {[BoldAttrs.Markup]: null}; // null

describe('Bold extension', () => {
    it('should parse bold **', () => same('**hello!**', doc(p(b(astAttrs, 'hello!')))));

    it('should parse bold __', () => same('__hello!__', doc(p(b(undAttrs, 'hello!')))));

    it('should parse bold inside text', () =>
        same('he**llo wor**ld!', doc(p('he', b(astAttrs, 'llo wor'), 'ld!'))));

    it('should parse html - b tag', () => {
        parseDOM(schema, '<p><b>text in b tag</b></p>', doc(p(b('text in b tag'))));
    });

    it('should parse html - strong tag', () => {
        parseDOM(
            schema,
            '<div><strong>text in strong tag</strong></div>',
            doc(p(b(nullAttrs, 'text in strong tag'))),
        );
    });

    it('should parse html - strong tag - with asterisk markup', () => {
        parseDOM(
            schema,
            '<div><strong data-markup="**">text in strong tag</strong></div>',
            doc(p(b(astAttrs, 'text in strong tag'))),
        );
    });

    it('should parse html - strong tag - with underscore markup', () => {
        parseDOM(
            schema,
            '<div><strong data-markup="__">text in strong tag</strong></div>',
            doc(p(b(undAttrs, 'text in strong tag'))),
        );
    });

    it('should parse html - font-weight:bold', () => {
        parseDOM(schema, '<div style="font-weight:bold">bold text</div>', doc(p(b('bold text'))));
    });

    it('should parse html - font-weight:bolder', () => {
        parseDOM(
            schema,
            '<div style="font-weight:bolder">bolder text</div>',
            doc(p(b('bolder text'))),
        );
    });

    it('should parse html - font-weight:700', () => {
        parseDOM(schema, '<div style="font-weight:700">700</div>', doc(p(b('700'))));
    });
});
