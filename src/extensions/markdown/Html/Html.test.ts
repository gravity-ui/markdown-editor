import {builders} from 'prosemirror-test-builder';

import {createMarkupChecker} from '../../../../tests/sameMarkup';
import {ExtensionsManager} from '../../../core';
import {BaseNode, BaseSchema} from '../../base/BaseSchema';

import {HtmlAttr, HtmlNode} from './const';

import {Html} from './index';

const {schema, parser, serializer} = new ExtensionsManager({
    extensions: (builder) => builder.use(BaseSchema, {}).use(Html),
    options: {mdOpts: {html: true}},
}).buildDeps();

const {doc, p} = builders<'doc' | 'p'>(schema, {
    doc: {nodeType: BaseNode.Doc},
    p: {nodeType: BaseNode.Paragraph},
});

const {same} = createMarkupChecker({parser, serializer});

describe('Html extension', () => {
    it('should parse inline html', () => {
        same(
            'This is <span>inline html</span>',
            doc(
                p(
                    'This is ',
                    schema.node(HtmlNode.Inline, {
                        [HtmlAttr.Content]: '<span>',
                    }),
                    'inline html',
                    schema.node(HtmlNode.Inline, {
                        [HtmlAttr.Content]: '</span>',
                    }),
                ),
            ),
        );
    });

    // TODO
    it.skip('should parse block html', () => {
        same(
            '<div>This is block html with <span>inline tags</span><div>',
            doc(
                schema.node(HtmlNode.Block, {
                    [HtmlAttr.Content]:
                        '<div>This is block html with <span>inline tags</span><div>',
                }),
            ),
        );
    });
});
