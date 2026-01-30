import {builders} from 'prosemirror-test-builder';

import {createMarkupChecker} from '../../../../tests/sameMarkup';
import {ExtensionsManager} from '../../../core';
import {BaseNode, BaseSchemaSpecs} from '../../specs';

import {YfmHtmlBlockSpecs} from './YfmHtmlBlockSpecs';
import {YfmHtmlBlockAttrs, yfmHtmlBlockNodeName} from './const';

jest.mock<{v4: () => string}>('uuid', () => ({
    v4: jest.fn().mockReturnValue('8bca-mocked-7abc'),
}));

const {
    schema,
    markupParser: parser,
    serializer,
} = new ExtensionsManager({
    extensions: (builder) => builder.use(BaseSchemaSpecs, {}).use(YfmHtmlBlockSpecs, {}),
}).buildDeps();

const {doc, yfmHtmlBlock} = builders<'doc' | 'yfmHtmlBlock'>(schema, {
    doc: {nodeType: BaseNode.Doc},
    yfmHtmlBlock: {nodeType: yfmHtmlBlockNodeName},
});

const {same} = createMarkupChecker({parser, serializer});

describe('YfmHtmlBlock extension', () => {
    it('should parse yfmHtmlBlock', () =>
        same(
            '::: html\ncontent\n:::',
            doc(
                yfmHtmlBlock({
                    [YfmHtmlBlockAttrs.srcdoc]: 'content\n',
                    [YfmHtmlBlockAttrs.EntityId]: 'yfm_html_block-8bca-mocked-7abc',
                }),
            ),
        ));
});
