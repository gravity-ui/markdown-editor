import {builders} from 'prosemirror-test-builder';
import {createMarkupChecker} from '../../../../tests/sameMarkup';
import {ExtensionsManager} from '../../../core';
import {BaseNode, BaseSchemaE} from '../../base/BaseSchema';
import {blockquote, BlockquoteE, italic, ItalicE} from '../../markdown';
import {CutNode} from './const';
import {YfmCutE} from './index';

const {schema, parser, serializer} = new ExtensionsManager({
    extensions: [BaseSchemaE(), ItalicE(), BlockquoteE(), YfmCutE()],
}).buildDeps();

const {doc, p, i, bq, cut, cutTitle, cutContent} = builders(schema, {
    doc: {nodeType: BaseNode.Doc},
    p: {nodeType: BaseNode.Paragraph},
    i: {markType: italic},
    bq: {nodeType: blockquote},
    cut: {nodeType: CutNode.Cut},
    cutTitle: {nodeType: CutNode.CutTitle},
    cutContent: {nodeType: CutNode.CutContent},
}) as PMTestBuilderResult<'doc' | 'p' | 'bq' | 'cut' | 'cutTitle' | 'cutContent', 'i'>;

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
});
