import {builders} from 'prosemirror-test-builder';

import {parseDOM} from '../../../../tests/parse-dom';
import {createMarkupChecker} from '../../../../tests/sameMarkup';
import {ExtensionsManager} from '../../../core';
import {BaseNode, BaseSchemaSpecs} from '../../base/specs';

import {SuperscriptSpecs, superscriptMarkName} from './SuperscriptSpecs';

const {
    schema,
    markupParser: parser,
    serializer,
} = new ExtensionsManager({
    extensions: (builder) => builder.use(BaseSchemaSpecs, {}).use(SuperscriptSpecs),
}).buildDeps();

const {doc, p, s} = builders<'doc' | 'p', 's'>(schema, {
    doc: {nodeType: BaseNode.Doc},
    p: {nodeType: BaseNode.Paragraph},
    s: {markType: superscriptMarkName},
});

const {same} = createMarkupChecker({parser, serializer});

describe('Superscript extension', () => {
    it('should parse superscript', () => same('^hello^', doc(p(s('hello')))));

    it('should parse superscript inside text', () =>
        same('hello^world^!', doc(p('hello', s('world'), '!'))));

    it('should parse html - sup tag', () => {
        parseDOM(schema, '<p><sup>superscript</sup></p>', doc(p(s('superscript'))));
    });

    it('should escape whitespaces', () => {
        same(
            'Ok, hello^w\\ o\\ r\\ l\\ d^! This world is beautiful!',
            doc(p('Ok, hello', s('w o r l d'), '! This world is beautiful!')),
        );
    });
});
