import {builders} from 'prosemirror-test-builder';
import {describe, it} from 'vitest';

import {createMarkupChecker} from '../../../../tests/sameMarkup';
import {ExtensionsManager} from '../../../core';
import {BaseNode, BaseSchemaSpecs} from '../../base/specs';

import {ImageAttr, ImageSpecs, imageNodeName} from './ImageSpecs';

const {
    schema,
    markupParser: parser,
    serializer,
} = new ExtensionsManager({
    extensions: (builder) => builder.use(BaseSchemaSpecs, {}).use(ImageSpecs),
}).buildDeps();

const {doc, p, img, img2} = builders<'doc' | 'p' | 'img' | 'img2'>(schema, {
    doc: {nodeType: BaseNode.Doc},
    p: {nodeType: BaseNode.Paragraph},
    img: {nodeType: imageNodeName, [ImageAttr.Src]: 'img.png'},
    img2: {
        nodeType: imageNodeName,
        [ImageAttr.Src]: 'img2.png',
        [ImageAttr.Alt]: 'alt text',
        [ImageAttr.Title]: 'title text',
    },
});

const {same, parse, serialize} = createMarkupChecker({parser, serializer});

describe('Image extension', () => {
    it('should parse image', () => {
        same('![](img.png)', doc(p(img())));
    });

    it('should parse image with title and alt', () => {
        same('![alt text](img2.png "title text")', doc(p(img2())));
    });

    it.each([
        {src: 'foo):', markup: String.raw`![](foo\):)`},
        {src: '(foo', markup: String.raw`![](\(foo)`},
        {
            src: 'https://example.com/+_file/#~anchor',
            markup: '![](https://example.com/+_file/#~anchor)',
        },
    ])('should preserve image destination $src', ({src, markup}) => {
        same(markup, doc(p(img({[ImageAttr.Src]: src}))));
    });

    it.each([
        {
            src: String.raw`https://example.com/a\*b.png`,
            markup: String.raw`![](https://example.com/a\\*b.png)`,
            normalized: 'https://example.com/a%5C*b.png',
        },
        {
            src: String.raw`foo\(bar`,
            markup: String.raw`![](foo\\\(bar)`,
            normalized: 'foo%5C(bar',
        },
    ])(
        'should preserve a literal backslash in image destination $src',
        ({src, markup, normalized}) => {
            const content = doc(p(img({[ImageAttr.Src]: src})));

            serialize(content, markup);
            parse(serializer.serialize(content), doc(p(img({[ImageAttr.Src]: normalized}))));
        },
    );

    it('should preserve quotes and parentheses in an image title', () => {
        same(
            String.raw`![](img.png "He said \"it's ((fine))\"")`,
            doc(p(img({[ImageAttr.Title]: 'He said "it\'s ((fine))"'}))),
        );
    });

    it.each([
        {title: String.raw`say \"hello"`, markup: String.raw`![](img.png "say \\\"hello\"")`},
        {title: String.raw`path\part`, markup: String.raw`![](img.png "path\\part")`},
        {title: 'ends\\', markup: String.raw`![](img.png "ends\\")`},
    ])('should preserve literal backslashes in an image title $title', ({title, markup}) => {
        same(markup, doc(p(img({[ImageAttr.Title]: title}))));
    });
});
