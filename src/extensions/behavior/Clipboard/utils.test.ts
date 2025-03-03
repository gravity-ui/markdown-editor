import {builders} from 'prosemirror-test-builder';

import {findNotEmptyContentPosses, trimContent} from 'src/extensions/behavior/Clipboard/utils';
import {CutAttr, CutNode, YfmCutSpecs} from 'src/extensions/yfm/YfmCut/YfmCutSpecs';

import {DirectiveContext} from '../../../../tests/utils';
import {ExtensionsManager} from '../../../core';
import {BaseNode, BaseSchemaSpecs} from '../../base/specs';
import {
    BlockquoteSpecs,
    ImageSpecs,
    ItalicSpecs,
    ListNode,
    ListsSpecs,
    blockquoteNodeName,
    imageNodeName,
    italicMarkName,
} from '../../markdown/specs';

const directiveContext = new DirectiveContext(undefined);

function buildDeps() {
    return new ExtensionsManager({
        extensions: (builder) => {
            builder.context.set('directiveSyntax', directiveContext);
            builder
                .use(BaseSchemaSpecs, {})
                .use(ItalicSpecs)
                .use(BlockquoteSpecs)
                .use(YfmCutSpecs, {})
                .use(ImageSpecs)
                .use(ListsSpecs, {});
        },
    }).buildDeps();
}

const {schema} = buildDeps();

const {doc, p, cut, cutTitle, cutContent, li, ul, ol, bq, img} = builders<
    'doc' | 'p' | 'bq' | 'img' | 'cut' | 'cutTitle' | 'cutContent',
    'i' | 'li' | 'ul' | 'ol'
>(schema, {
    doc: {nodeType: BaseNode.Doc},
    p: {nodeType: BaseNode.Paragraph},
    i: {markType: italicMarkName},
    bq: {nodeType: blockquoteNodeName},
    img: {nodeType: imageNodeName},
    cut: {nodeType: CutNode.Cut},
    cutTitle: {nodeType: CutNode.CutTitle},
    cutContent: {nodeType: CutNode.CutContent},
    li: {nodeType: ListNode.ListItem},
    ul: {nodeType: ListNode.BulletList},
    ol: {nodeType: ListNode.OrderedList},
});

describe('findNotEmptyContentPosses', () => {
    it('identifies boundaries in a simple document', () => {
        const fragment = doc(p('11'), p('22')).content;
        expect(findNotEmptyContentPosses(fragment)).toEqual([0, 8, 0, 8]);
    });

    it('ignores empty paragraphs and detects valid content', () => {
        const fragment = doc(p(), p('11'), p('22'), p()).content;
        expect(findNotEmptyContentPosses(fragment)).toEqual([2, 10, 0, 12]);
    });

    it('handles custom nodes correctly', () => {
        const fragment = doc(
            cut({[CutAttr.Markup]: '{%'}, cutTitle(''), cutContent(p())),
            p('11'),
            p('22'),
        ).content;
        expect(findNotEmptyContentPosses(fragment)).toEqual([0, 16, 0, 16]);
    });

    it('skips empty list at start and finds content boundaries', () => {
        const fragment = doc(ul(li(p(''))), p('11'), p('22')).content;
        expect(findNotEmptyContentPosses(fragment)).toEqual([6, 14, 0, 14]);
    });

    it('skips empty list between paragraphs', () => {
        const fragment = doc(p('11'), ul(li(p(''))), p('22')).content;
        expect(findNotEmptyContentPosses(fragment)).toEqual([0, 14, 0, 14]);
    });

    it('ignores deeply nested empty lists', () => {
        const fragment = doc(ul(li(p(''), ul(li(p(''))))), p('11'), p('22')).content;
        expect(findNotEmptyContentPosses(fragment)).toEqual([12, 20, 0, 20]);
    });

    it('handles multiple empty lists before and after content', () => {
        const fragment = doc(
            ul(li(p(''), ul(li(p(''))))),
            p('11'),
            p('22'),
            ul(li(p(''), ul(li(p(''))))),
        ).content;
        expect(findNotEmptyContentPosses(fragment)).toEqual([12, 20, 0, 32]);
    });

    it('identifies non-empty text inside a blockquote', () => {
        const fragment = doc(bq(p('Quote text'))).content;
        expect(findNotEmptyContentPosses(fragment)).toEqual([0, 14, 0, 14]);
    });

    it('identifies content inside an image node', () => {
        const fragment = doc(p(), p(img({src: 'blob:test.jpg', alt: 'test.jpg'})), p()).content;
        expect(findNotEmptyContentPosses(fragment)).toEqual([2, 5, 0, 7]);
    });

    it('handles a document with only empty elements', () => {
        const fragment = doc(p(), ul(li(p(''))), ol(li(p('')))).content;
        expect(findNotEmptyContentPosses(fragment)).toEqual([-1, -1, 0, 14]);
    });

    it('detects non-empty text after an empty section', () => {
        const fragment = doc(p(), p(), p('Content')).content;
        expect(findNotEmptyContentPosses(fragment)).toEqual([4, 13, 0, 13]);
    });

    it('detects non-empty content after multiple nested empty lists', () => {
        const fragment = doc(ul(li(p(''), ul(li(p(''))))), ul(li(p(''))), p('Final')).content;
        expect(findNotEmptyContentPosses(fragment)).toEqual([18, 25, 0, 25]);
    });
});

describe('trimContent', () => {
    it('removes empty list items at the start and end of a bullet list', () => {
        const fragment = doc(ul(li(), li(p('11')), li(p('22')), li())).content;

        const trimmedFragment = trimContent(fragment);
        expect(schema.nodes.doc.create(null, trimmedFragment)).toMatchNode(
            doc(ul(li(p('11')), li(p('22')))),
        );
    });

    it('removes empty list items at the start and end of an ordered list', () => {
        const fragment = doc(ol(li(), li(p('11')), li(p('22')), li())).content;

        const trimmedFragment = trimContent(fragment);
        expect(schema.nodes.doc.create(null, trimmedFragment)).toMatchNode(
            doc(ol(li(p('11')), li(p('22')))),
        );
    });

    it('removes only empty list items at the start and end, keeping empty ones in the middle', () => {
        const fragment = doc(ul(li(), li(p('11')), li(), li(p('22')), li())).content;

        const trimmedFragment = trimContent(fragment);
        expect(schema.nodes.doc.create(null, trimmedFragment)).toMatchNode(
            doc(ul(li(p('11')), li(), li(p('22')))),
        );
    });

    it('does not modify a list with no empty items', () => {
        const fragment = doc(ul(li(p('11')), li(p('22')))).content;

        const trimmedFragment = trimContent(fragment);
        expect(schema.nodes.doc.create(null, trimmedFragment)).toMatchNode(
            doc(ul(li(p('11')), li(p('22')))),
        );
    });

    it('trims a list to one empty list item if it contains only empty list items', () => {
        const fragment = doc(ul(li(), li(), li())).content;

        const trimmedFragment = trimContent(fragment);
        expect(schema.nodes.doc.create(null, trimmedFragment)).toMatchNode(doc(ul()));
    });

    it('correctly handles multiple lists in a single fragment', () => {
        const fragment = doc(
            ul(li(), li(p('11')), li(), li(p('22')), li()),
            ol(li(), li(p('A')), li(p('B')), li()),
        ).content;

        const trimmedFragment = trimContent(fragment);
        expect(schema.nodes.doc.create(null, trimmedFragment)).toMatchNode(
            doc(ul(li(p('11')), li(), li(p('22')), li()), ol(li(), li(p('A')), li(p('B')))),
        );
    });

    it('does not modify paragraphs and other nodes outside lists', () => {
        const fragment = doc(
            p('Some text'),
            ul(li(), li(p('11')), li(p('22')), li()),
            p('More text'),
        ).content;

        const trimmedFragment = trimContent(fragment);
        expect(schema.nodes.doc.create(null, trimmedFragment)).toMatchNode(
            doc(p('Some text'), ul(li(), li(p('11')), li(p('22')), li()), p('More text')),
        );
    });
});
