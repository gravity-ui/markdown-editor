import {builders} from 'prosemirror-test-builder';
import {createMarkupChecker} from '../../../../tests/sameMarkup';
import {ExtensionsManager} from '../../../core';
import {BaseNode, BaseSchemaE} from '../../base/BaseSchema';
import {ImageE} from './index';
import {image, ImageAttr} from './const';

const {schema, parser, serializer} = new ExtensionsManager({
    extensions: [BaseSchemaE(), ImageE()],
}).buildDeps();

const {doc, p, img, img2} = builders(schema, {
    doc: {nodeType: BaseNode.Doc},
    p: {nodeType: BaseNode.Paragraph},
    img: {nodeType: image, [ImageAttr.Src]: 'img.png'},
    img2: {
        nodeType: image,
        [ImageAttr.Src]: 'img2.png',
        [ImageAttr.Alt]: 'alt text',
        [ImageAttr.Title]: 'title text',
    },
}) as PMTestBuilderResult<'doc' | 'p' | 'img' | 'img2'>;

const {same} = createMarkupChecker({parser, serializer});

describe('Image extension', () => {
    it('should parse image', () => {
        same('![](img.png)', doc(p(img())));
    });

    it('should parse image with title and alt', () => {
        same('![alt text](img2.png "title text")', doc(p(img2())));
    });
});
