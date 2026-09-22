import {builders} from 'prosemirror-test-builder';

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

const {same} = createMarkupChecker({parser, serializer});

describe('Image extension', () => {
    it('should parse image', () => {
        same('![](img.png)', doc(p(img())));
    });

    it('should parse image with title and alt', () => {
        same('![alt text](img2.png "title text")', doc(p(img2())));
    });

    it.each([
        ['/image?x=&copy;', '/image?x=&amp;copy;'],
        ['/image?x=&#65;&y=&#x41;', '/image?x=&amp;#65;&y=&amp;#x41;'],
        ['/image?x=&amp;', '/image?x=&amp;amp;'],
        ['/image?a=1&b=2', '/image?a=1&amp;b=2'],
        ['/image?x=%26copy%3B', '/image?x=%26copy%3B'],
    ])('should preserve the image URL after serialization: %s', (src, escaped) => {
        const original = doc(p(img({src})));
        const markup = serializer.serialize(original);

        expect(markup).toBe(`![](${escaped})`);
        expect(parser.parse(markup)).toMatchNode(original);
    });

    it('should preserve ampersands when they are configured as Markdown escape characters', () => {
        const original = doc(p(img({src: '/image?x=&copy;'})));
        const markup = serializer.serialize(original, {commonEscape: /[&]/g});

        expect(markup).toBe('![](/image?x=&amp;copy;)');
        expect(parser.parse(markup)).toMatchNode(original);
    });
});
