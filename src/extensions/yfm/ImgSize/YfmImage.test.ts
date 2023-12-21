import {builders} from 'prosemirror-test-builder';
import {createMarkupChecker} from '../../../../tests/sameMarkup';
import {ExtensionsManager} from '../../../core';
import {BaseNode, BaseSchema} from '../../base/BaseSchema';
import {ImgSizeSpecs} from './ImgSizeSpecs';
import {imageNodeName, ImgSizeAttr} from './const';

const {schema, parser, serializer} = new ExtensionsManager({
    extensions: (builder) => builder.use(BaseSchema, {}).use(ImgSizeSpecs, {}),
}).buildDeps();

const {doc, p, img, img2, img3, img4} = builders<'doc' | 'p' | 'img' | 'img2' | 'img3' | 'img4'>(
    schema,
    {
        doc: {nodeType: BaseNode.Doc},
        p: {nodeType: BaseNode.Paragraph},
        img: {nodeType: imageNodeName, [ImgSizeAttr.Src]: 'img.png'},
        img2: {
            nodeType: imageNodeName,
            [ImgSizeAttr.Src]: 'img2.png',
            [ImgSizeAttr.Alt]: 'alt text',
            [ImgSizeAttr.Title]: 'title text',
        },
        img3: {
            nodeType: imageNodeName,
            [ImgSizeAttr.Src]: 'img3.png',
            [ImgSizeAttr.Height]: '100',
            [ImgSizeAttr.Width]: '200',
        },
        img4: {
            nodeType: imageNodeName,
            [ImgSizeAttr.Src]: 'img4.png',
            [ImgSizeAttr.Height]: '300',
            [ImgSizeAttr.Width]: '400',
            [ImgSizeAttr.Alt]: 'alt text 2',
            [ImgSizeAttr.Title]: 'title text 2',
        },
    },
);

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
