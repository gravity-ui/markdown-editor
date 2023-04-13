import {builders} from 'prosemirror-test-builder';
import {createMarkupChecker} from '../../../../tests/sameMarkup';
import {ExtensionsManager} from '../../../core';
import {BaseNode, BaseSpecsPreset} from '../../base/specs';
import {ImageAttr, imageNodeName, ImageSpecs} from './ImageSpecs';

const {schema, parser, serializer} = new ExtensionsManager({
    extensions: (builder) => builder.use(BaseSpecsPreset, {}).use(ImageSpecs),
}).buildDeps();

const {doc, p, img, img2} = builders(schema, {
    doc: {nodeType: BaseNode.Doc},
    p: {nodeType: BaseNode.Paragraph},
    img: {nodeType: imageNodeName, [ImageAttr.Src]: 'img.png'},
    img2: {
        nodeType: imageNodeName,
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
