import {builders} from 'prosemirror-test-builder';

import {createMarkupChecker} from '../../../../tests/sameMarkup';
import {ExtensionsManager} from '../../../core';
import {BaseNode, BaseSchemaSpecs} from '../../../extensions/specs';

import {YfmHtmlSpecs} from './YfmHtmlSpecs';
import {YfmHtmlAttrs, yfmHtmlNodeName} from './const';

const {
    schema,
    markupParser: parser,
    serializer,
} = new ExtensionsManager({
    extensions: (builder) => builder.use(BaseSchemaSpecs, {}).use(YfmHtmlSpecs, {}),
}).buildDeps();

const {doc, yfmHtml} = builders<'doc' | 'yfmHtml'>(schema, {
    doc: {nodeType: BaseNode.Doc},
    yfmHtml: {nodeType: yfmHtmlNodeName},
});

const {same} = createMarkupChecker({parser, serializer});

describe('MErmaid extension', () => {
    it('should parse yfmHtml', () =>
        same('```yfmHtml\ncontent\n```\n', doc(yfmHtml({[YfmHtmlAttrs.srcdoc]: 'content\n'}))));
});
