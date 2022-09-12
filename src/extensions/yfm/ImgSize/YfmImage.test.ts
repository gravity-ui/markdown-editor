/**
 * @jest-environment jsdom
 */

import MarkdownIt from 'markdown-it';
import {builders} from 'prosemirror-test-builder';
import {createMarkupChecker} from '../../../../tests/sameMarkup';
import {ExtensionsManager} from '../../../core';
import {BaseNode, BaseSchemaE} from '../../base/BaseSchema';
import {ImgSizeE} from './index';
import {image, ImageAttr} from './const';

const {schema, parser, serializer} = new ExtensionsManager({
    md: new MarkdownIt('commonmark'),
    extensions: [BaseSchemaE(), ImgSizeE()],
}).buildDeps();

const {doc, p, img, img2, img3, img4} = builders(schema, {
    doc: {nodeType: BaseNode.Doc},
    p: {nodeType: BaseNode.Paragraph},
    img: {nodeType: image, [ImageAttr.Src]: 'img.png'},
    img2: {
        nodeType: image,
        [ImageAttr.Src]: 'img2.png',
        [ImageAttr.Alt]: 'alt text',
        [ImageAttr.Title]: 'title text',
    },
    img3: {
        nodeType: image,
        [ImageAttr.Src]: 'img3.png',
        [ImageAttr.Height]: '100',
        [ImageAttr.Width]: '200',
    },
    img4: {
        nodeType: image,
        [ImageAttr.Src]: 'img4.png',
        [ImageAttr.Height]: '300',
        [ImageAttr.Width]: '400',
        [ImageAttr.Alt]: 'alt text 2',
        [ImageAttr.Title]: 'title text 2',
    },
}) as PMTestBuilderResult<'doc' | 'p' | 'img' | 'img2' | 'img3' | 'img4'>;

const {same} = createMarkupChecker({parser, serializer});

describe('Image extension', () => {
    it('should parse image', () => {
        same('![](img.png)', doc(p(img())));
    });

    it('should parse image with title and alt', () => {
        same('![alt text](img2.png "title text")', doc(p(img2())));
    });

    it('should parse image with size', () => {
        same('![](img3.png =200x100)', doc(p(img3())));
    });

    it('should parse image with size, alt and title', () => {
        same('![alt text 2](img4.png "title text 2" =400x300)', doc(p(img4())));
    });
});
