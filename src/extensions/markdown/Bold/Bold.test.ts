import {builders} from 'prosemirror-test-builder';

import {parseDOM} from '../../../../tests/parse-dom';
import {createMarkupChecker} from '../../../../tests/sameMarkup';
import {ExtensionsManager} from '../../../core';
import {BaseNode, BaseSchemaSpecs} from '../../base/specs';

import {BoldSpecs, boldMarkName} from './BoldSpecs';

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

describe('Bold extension', () => {
    it('should parse bold **', () => same('**hello!**', doc(p(b('hello!')))));

    it.skip('should parse bold __', () => same('__hello!__', doc(p(b('hello!')))));

    it('should parse bold inside text', () =>
        same('he**llo wor**ld!', doc(p('he', b('llo wor'), 'ld!'))));

    it('should parse html - em tag', () => {
        parseDOM(schema, '<p><b>text in b tag</b></p>', doc(p(b('text in b tag'))));
    });

    it('should parse html - strong tag', () => {
        parseDOM(
            schema,
            '<div><strong>text in strong tag</strong></div>',
            doc(p(b('text in strong tag'))),
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
