import {builders} from 'prosemirror-test-builder';

import {parseDOM} from '../../../../tests/parse-dom';
import {createMarkupChecker} from '../../../../tests/sameMarkup';
import {ExtensionsManager} from '../../../core';
import {BaseNode, BaseSpecsPreset} from '../../base/specs';
import {
    BlockquoteSpecs,
    ImageAttr,
    ImageSpecs,
    ItalicSpecs,
    blockquoteNodeName,
    imageNodeName,
    italicMarkName,
} from '../../markdown/specs';

import {CutNode, YfmCutSpecs} from './YfmCutSpecs';

const {schema, parser, serializer} = new ExtensionsManager({
    extensions: (builder) =>
        builder
            .use(BaseSpecsPreset, {})
            .use(ItalicSpecs)
            .use(BlockquoteSpecs)
            .use(YfmCutSpecs, {})
            .use(ImageSpecs),
}).buildDeps();

const {doc, p, i, bq, img, cut, cutTitle, cutContent} = builders<
    'doc' | 'p' | 'bq' | 'img' | 'cut' | 'cutTitle' | 'cutContent',
    'i'
>(schema, {
    doc: {nodeType: BaseNode.Doc},
    p: {nodeType: BaseNode.Paragraph},
    i: {markType: italicMarkName},
    bq: {nodeType: blockquoteNodeName},
    img: {nodeType: imageNodeName},
    cut: {nodeType: CutNode.Cut},
    cutTitle: {nodeType: CutNode.CutTitle},
    cutContent: {nodeType: CutNode.CutContent},
});

const {same} = createMarkupChecker({parser, serializer});

describe('YfmCut extension', () => {
    it('should parse yfm-cut', () => {
        const markup = `
{% cut "cut title" %}

cut content

cut content 2

{% endcut %}
`.trim();

        same(
            markup,
            doc(cut(cutTitle('cut title'), cutContent(p('cut content'), p('cut content 2')))),
        );
    });

    it('should parse nested yfm-cuts', () => {
        const markup = `
{% cut "cut title" %}

{% cut "cut title 2" %}

cut content

{% endcut %}

{% endcut %}
`.trim();

        same(
            markup,
            doc(
                cut(
                    cutTitle('cut title'),
                    cutContent(cut(cutTitle('cut title 2'), cutContent(p('cut content')))),
                ),
            ),
        );
    });

    it('should parse yfm-cut under blockquote', () => {
        const markup = `
> {% cut "cut title" %}
> 
> cut content
>
> {% endcut %}
`.trim();

        same(markup, doc(bq(cut(cutTitle('cut title'), cutContent(p('cut content'))))));
    });

    it('should parse yfm-cut with inline markup in cut title', () => {
        const markup = `
{% cut "*cut italic title*" %}

cut content

{% endcut %}
    `.trim();

        same(markup, doc(cut(cutTitle(i('cut italic title')), cutContent(p('cut content')))));
    });

    it('should parse yfm-cut with inline node in cut title', () => {
        const markup = `
{% cut "![img](path/to/img)" %}

cut content

{% endcut %}
    `.trim();

        same(
            markup,
            doc(
                cut(
                    cutTitle(
                        img({
                            [ImageAttr.Src]: 'path/to/img',
                            [ImageAttr.Alt]: 'img',
                        }),
                    ),
                    cutContent(p('cut content')),
                ),
            ),
        );
    });

    it('should parse yfm-note from html', () => {
        parseDOM(
            schema,
            '<div class="yfm-cut">' +
                '<div class="yfm-cut-title">YfmCut title</div>' +
                '<div><p>YfmCut content</p></div' +
                '</div>',
            doc(cut(cutTitle('YfmCut title'), cutContent(p('YfmCut content')))),
        );
    });
});
