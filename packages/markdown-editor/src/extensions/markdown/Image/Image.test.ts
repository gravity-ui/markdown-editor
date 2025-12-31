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
});
