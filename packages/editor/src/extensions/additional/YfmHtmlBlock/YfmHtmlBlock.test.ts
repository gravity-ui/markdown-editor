import {builders} from 'prosemirror-test-builder';
import dd from 'ts-dedent';

import {createMarkupChecker} from '../../../../tests/sameMarkup';
import {ExtensionsManager} from '../../../core';
import {
    BaseNode,
    BaseSchemaSpecs,
    BlockquoteSpecs,
    ListNode,
    ListsAttr,
    ListsSpecs,
    blockquoteNodeName,
} from '../../specs';

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
    extensions: (builder) =>
        builder
            .use(BaseSchemaSpecs, {})
            .use(BlockquoteSpecs)
            .use(ListsSpecs)
            .use(YfmHtmlBlockSpecs, {}),
}).buildDeps();

const {doc, q, li, ul, yfmHtmlBlock} = builders<'doc' | 'q' | 'li' | 'ul' | 'yfmHtmlBlock'>(
    schema,
    {
        doc: {nodeType: BaseNode.Doc},
        q: {nodeType: blockquoteNodeName},
        li: {nodeType: ListNode.ListItem},
        ul: {nodeType: ListNode.BulletList},
        yfmHtmlBlock: {nodeType: yfmHtmlBlockNodeName},
    },
);

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

    it('should serialize multiline yfmHtmlBlock inside blockquote', () => {
        const srcdoc = '<div>one</div>\n<div>two</div>\n';
        const markup = dd`
        > ::: html
        > <div>one</div>
        > <div>two</div>
        > :::
        `.trim();

        same(
            markup,
            doc(
                q(
                    yfmHtmlBlock({
                        [YfmHtmlBlockAttrs.srcdoc]: srcdoc,
                        [YfmHtmlBlockAttrs.EntityId]: 'yfm_html_block-8bca-mocked-7abc',
                    }),
                ),
            ),
        );
    });

    it('should preserve trailing blank line in blockquoted yfmHtmlBlock content', () => {
        const srcdoc = '<div>one</div>\n\n';
        const markup = ['> ::: html', '> <div>one</div>', '> ', '> :::'].join('\n');

        same(
            markup,
            doc(
                q(
                    yfmHtmlBlock({
                        [YfmHtmlBlockAttrs.srcdoc]: srcdoc,
                        [YfmHtmlBlockAttrs.EntityId]: 'yfm_html_block-8bca-mocked-7abc',
                    }),
                ),
            ),
        );
    });

    it('should preserve trailing blank line in yfmHtmlBlock content', () => {
        const srcdoc = '<div>one</div>\n\n';
        const markup = ['::: html', '<div>one</div>', '', ':::'].join('\n');

        same(
            markup,
            doc(
                yfmHtmlBlock({
                    [YfmHtmlBlockAttrs.srcdoc]: srcdoc,
                    [YfmHtmlBlockAttrs.EntityId]: 'yfm_html_block-8bca-mocked-7abc',
                }),
            ),
        );
    });

    it('should serialize multiline yfmHtmlBlock inside list item', () => {
        const srcdoc = '<div>one</div>\n<div>two</div>\n';
        const markup = dd`
        * ::: html
          <div>one</div>
          <div>two</div>
          :::
        `.trim();

        same(
            markup,
            doc(
                ul(
                    {[ListsAttr.Markup]: '*', [ListsAttr.Tight]: false},
                    li(
                        {[ListsAttr.Markup]: '*'},
                        yfmHtmlBlock({
                            [YfmHtmlBlockAttrs.srcdoc]: srcdoc,
                            [YfmHtmlBlockAttrs.EntityId]: 'yfm_html_block-8bca-mocked-7abc',
                        }),
                    ),
                ),
            ),
        );
    });
});
