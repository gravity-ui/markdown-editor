import {EditorState} from 'prosemirror-state';
import {builders} from 'prosemirror-test-builder';
import {describe, expect, it} from 'vitest';

import {parseDOM} from '../../../../tests/parse-dom';
import {createMarkupChecker} from '../../../../tests/sameMarkup';
import {ExtensionsManager} from '../../../core';
import {BaseNode, BaseSchemaSpecs} from '../../base/specs';
import {BoldSpecs, CodeSpecs, ImageSpecs, ItalicSpecs} from '../specs';

import {DeflistNode, DeflistSpecs} from './DeflistSpecs';

const {
    schema,
    markupParser: parser,
    serializer,
} = new ExtensionsManager({
    extensions: (builder) =>
        builder
            .use(BaseSchemaSpecs, {})
            .use(DeflistSpecs, {})
            .use(BoldSpecs)
            .use(ItalicSpecs)
            .use(CodeSpecs)
            .use(ImageSpecs),
}).buildDeps();

const {doc, p, dl, dt, dd} = builders<'doc' | 'p' | 'dl' | 'dt' | 'dd'>(schema, {
    doc: {nodeType: BaseNode.Doc},
    p: {nodeType: BaseNode.Paragraph},
    dl: {nodeType: DeflistNode.List},
    dt: {nodeType: DeflistNode.Term},
    dd: {nodeType: DeflistNode.Desc},
});

const {same} = createMarkupChecker({parser, serializer});

describe('Deflist extension', () => {
    it('should parse a deflist', () => {
        same(['Term', ': Description'].join('\n'), doc(dl(dt('Term'), dd(p('Description')))));
    });

    it('should parse a deflist with few terms', () => {
        const markup = `
Term 1
: Description 1

Term 2
: Description 2
`.trim();

        return same(
            markup,
            doc(dl(dt('Term 1'), dd(p('Description 1')), dt('Term 2'), dd(p('Description 2')))),
        );
    });

    it('should parse a nested deflists', () => {
        const markup = `
Term 1
: Description 1

  Term 1.1
  : Description 1.1

Term 2
: Description 2
`.trim();

        return same(
            markup,
            doc(
                dl(
                    dt('Term 1'),
                    dd(p('Description 1'), dl(dt('Term 1.1'), dd(p('Description 1.1')))),
                    dt('Term 2'),
                    dd(p('Description 2')),
                ),
            ),
        );
    });

    // TODO: pasrsed to: doc(dt("Term"), dd(paragraph("Description")))
    it.skip('should parse html', () => {
        parseDOM(
            schema,
            '<div><dl><dt>Term</dt><dd>Description</dd></dl></div>',
            doc(dl(dt('Term'), dd(p('Description')))),
        );
    });
});

describe('single-line serialization', () => {
    const blocks = [{name: 'definition term', markup: 'TITLE\n: Description'}];
    describe.each([
        {name: 'LF', entity: '&#10;'},
        {name: 'CR', entity: '&#13;'},
        {name: 'CRLF', entity: '&#13;&#10;'},
    ])('single-line serialization with $name', ({entity}) => {
        it.each(blocks)('should normalize marked text in a $name', ({markup}) => {
            const input = parser.parse(markup.replace('TITLE', `*&#32;x${entity}y*`));
            const expected = parser.parse(markup.replace('TITLE', ' *x y*'));

            expect(parser.parse(serializer.serialize(input))).toMatchNode(expected);
        });
    });

    describe('single-line serialization with inline code', () => {
        it.each(blocks)('should keep code and adjacent images in a $name', ({markup}) => {
            const expected = parser.parse(markup.replace('TITLE', '**A** *`x y`* ![i](img)'));
            let textPosition = -1;
            expected.descendants((node, pos) => {
                if (node.isText && node.text === 'x y') textPosition = pos;
            });
            expect(textPosition).toBeGreaterThan(-1);
            const input = EditorState.create({doc: expected}).tr.insertText(
                'x\ny',
                textPosition,
                textPosition + 3,
            ).doc;

            expect(parser.parse(serializer.serialize(input))).toMatchNode(expected);
        });
    });
});
