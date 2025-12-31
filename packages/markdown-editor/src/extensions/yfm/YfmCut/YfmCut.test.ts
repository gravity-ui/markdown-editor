import {builders} from 'prosemirror-test-builder';
import dd from 'ts-dedent';

import {parseDOM} from '../../../../tests/parse-dom';
import {createMarkupChecker} from '../../../../tests/sameMarkup';
import {DirectiveContext} from '../../../../tests/utils';
import {ExtensionsManager} from '../../../core';
import {BaseNode, BaseSchemaSpecs} from '../../base/specs';
import {
    BlockquoteSpecs,
    ImageAttr,
    ImageSpecs,
    ItalicSpecs,
    blockquoteNodeName,
    imageNodeName,
    italicMarkName,
} from '../../markdown/specs';

import {CutAttr, CutNode, YfmCutSpecs} from './YfmCutSpecs';

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
                .use(ImageSpecs);
        },
    }).buildDeps();
}
function buildCheckers() {
    const {markupParser, serializer} = buildDeps();
    return createMarkupChecker({parser: markupParser, serializer});
}

const {schema, markupParser: parser, serializer} = buildDeps();

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
        const markup = dd`
        {% cut "cut title" %}

        cut content

        cut content 2

        {% endcut %}
        `.trim();

        same(
            markup,
            doc(
                cut(
                    {[CutAttr.Markup]: '{%'},
                    cutTitle('cut title'),
                    cutContent(p('cut content'), p('cut content 2')),
                ),
            ),
        );
    });

    it('should parse nested yfm-cuts', () => {
        const markup = dd`
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
                    {[CutAttr.Markup]: '{%'},
                    cutTitle('cut title'),
                    cutContent(
                        cut(
                            {[CutAttr.Markup]: '{%'},
                            cutTitle('cut title 2'),
                            cutContent(p('cut content')),
                        ),
                    ),
                ),
            ),
        );
    });

    it('should parse yfm-cut under blockquote', () => {
        const markup = dd`
        > {% cut "cut title" %}
        > 
        > cut content
        >
        > {% endcut %}
        `.trim();

        same(
            markup,
            doc(
                bq(
                    cut(
                        {[CutAttr.Markup]: '{%'},
                        cutTitle('cut title'),
                        cutContent(p('cut content')),
                    ),
                ),
            ),
        );
    });

    it('should parse yfm-cut with inline markup in cut title', () => {
        const markup = dd`
        {% cut "*cut italic title*" %}

        cut content

        {% endcut %}
        `.trim();

        same(
            markup,
            doc(
                cut(
                    {[CutAttr.Markup]: '{%'},
                    cutTitle(i('cut italic title')),
                    cutContent(p('cut content')),
                ),
            ),
        );
    });

    it('should parse yfm-cut with inline node in cut title', () => {
        const markup = dd`
        {% cut "![img](path/to/img)" %}

        cut content

        {% endcut %}
        `.trim();

        same(
            markup,
            doc(
                cut(
                    {[CutAttr.Markup]: '{%'},
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

    it('should parse yfm-cut from html', () => {
        parseDOM(
            schema,
            '<div class="yfm-cut">' +
                '<div class="yfm-cut-title">YfmCut title</div>' +
                '<div><p>YfmCut content</p></div' +
                '</div>',
            doc(cut(cutTitle('YfmCut title'), cutContent(p('YfmCut content')))),
        );
    });

    it('should parse yfm-cut with markup attr from html', () => {
        parseDOM(
            schema,
            '<div class="yfm-cut" data-markup="{%">' +
                '<div class="yfm-cut-title">YfmCut title</div>' +
                '<div><p>YfmCut content</p></div' +
                '</div>',
            doc(
                cut(
                    {[CutAttr.Markup]: '{%'},
                    cutTitle('YfmCut title'),
                    cutContent(p('YfmCut content')),
                ),
            ),
        );
    });

    describe('Directive syntax', () => {
        afterAll(() => {
            directiveContext.setOption(undefined);
        });

        const PM_DOC = {
            CurlyCut: doc(
                cut({[CutAttr.Markup]: '{%'}, cutTitle('title'), cutContent(p('content'))),
            ),
            UnknownCut: doc(cut(cutTitle('title'), cutContent(p('content')))),
            DirectiveCut: doc(
                cut({[CutAttr.Markup]: ':::cut'}, cutTitle('title'), cutContent(p('content'))),
            ),
        };
        const MARKUP = {
            CurlySyntax: dd`
            {% cut "title" %}

            content

            {% endcut %}
            `,

            DirectiveSyntax: dd`
            :::cut [title]
            content

            :::
            `,
        };

        describe('directiveSyntax:disabled', () => {
            beforeAll(() => {
                directiveContext.setOption('disabled');
            });

            it('should parse curly cut syntax', () => {
                const {parse} = buildCheckers();
                parse(MARKUP.CurlySyntax, PM_DOC.CurlyCut, {json: true});
            });

            it('should not parse directive cut syntax', () => {
                const {parse} = buildCheckers();
                parse(MARKUP.DirectiveSyntax, doc(p(':::cut [title]\ncontent'), p(':::')), {
                    json: true,
                });
            });

            it('should preserve curly cut syntax', () => {
                const {serialize} = buildCheckers();
                serialize(PM_DOC.CurlyCut, MARKUP.CurlySyntax);
            });

            it('should serialize cut with unknown markup to curly syntax', () => {
                const {serialize} = buildCheckers();
                serialize(PM_DOC.UnknownCut, MARKUP.CurlySyntax);
            });

            it('should preserve directive cut to curly syntax', () => {
                const {serialize} = buildCheckers();
                serialize(PM_DOC.DirectiveCut, MARKUP.DirectiveSyntax);
            });
        });

        describe('directiveSyntax:enabled', () => {
            beforeAll(() => {
                directiveContext.setOption('enabled');
            });

            it('should parse curly cut syntax', () => {
                const {parse} = buildCheckers();
                parse(MARKUP.CurlySyntax, PM_DOC.CurlyCut, {json: true});
            });

            it('should parse directive cut syntax', () => {
                const {parse} = buildCheckers();
                parse(MARKUP.DirectiveSyntax, PM_DOC.DirectiveCut, {json: true});
            });

            it('should preserve curly cut syntax', () => {
                const {serialize} = buildCheckers();
                serialize(PM_DOC.CurlyCut, MARKUP.CurlySyntax);
            });

            it('should serialize cut with unknown markup to curly syntax', () => {
                const {serialize} = buildCheckers();
                serialize(PM_DOC.UnknownCut, MARKUP.CurlySyntax);
            });

            it('should preserve directive cut syntax', () => {
                const {serialize} = buildCheckers();
                serialize(PM_DOC.DirectiveCut, MARKUP.DirectiveSyntax);
            });
        });

        describe('directiveSyntax:preserve', () => {
            beforeAll(() => {
                directiveContext.setOption('preserve');
            });

            it('should parse curly cut syntax', () => {
                const {parse} = buildCheckers();
                parse(MARKUP.CurlySyntax, PM_DOC.CurlyCut, {json: true});
            });

            it('should parse directive cut syntax', () => {
                const {parse} = buildCheckers();
                parse(MARKUP.DirectiveSyntax, PM_DOC.DirectiveCut, {json: true});
            });

            it('should preserve curly cut syntax', () => {
                const {serialize} = buildCheckers();
                serialize(PM_DOC.CurlyCut, MARKUP.CurlySyntax);
            });

            it('should serialize cut with unknown markup to directive syntax', () => {
                const {serialize} = buildCheckers();
                serialize(PM_DOC.UnknownCut, MARKUP.DirectiveSyntax);
            });

            it('should preserve directive cut syntax', () => {
                const {serialize} = buildCheckers();
                serialize(PM_DOC.DirectiveCut, MARKUP.DirectiveSyntax);
            });
        });

        describe('directiveSyntax:overwrite', () => {
            beforeAll(() => {
                directiveContext.setOption('overwrite');
            });

            it('should parse curly cut syntax', () => {
                const {parse} = buildCheckers();
                parse(MARKUP.CurlySyntax, PM_DOC.CurlyCut, {json: true});
            });

            it('should parse directive cut syntax', () => {
                const {parse} = buildCheckers();
                parse(MARKUP.DirectiveSyntax, PM_DOC.DirectiveCut, {json: true});
            });

            it('should overwrite curly cut to directive syntax', () => {
                const {serialize} = buildCheckers();
                serialize(PM_DOC.CurlyCut, MARKUP.DirectiveSyntax);
            });

            it('should serialize cut with unknown markup to directive syntax', () => {
                const {serialize} = buildCheckers();
                serialize(PM_DOC.UnknownCut, MARKUP.DirectiveSyntax);
            });

            it('should preserve directive cut syntax', () => {
                const {serialize} = buildCheckers();
                serialize(PM_DOC.DirectiveCut, MARKUP.DirectiveSyntax);
            });
        });

        describe('directiveSyntax:only', () => {
            beforeAll(() => {
                directiveContext.setOption('only');
            });

            it('should not parse curly cut syntax', () => {
                const {parse} = buildCheckers();
                parse(
                    MARKUP.CurlySyntax,
                    doc(p('{% cut "title" %}'), p('content'), p('{% endcut %}')),
                    {json: true},
                );
            });

            it('should parse directive cut syntax', () => {
                const {parse} = buildCheckers();
                parse(MARKUP.DirectiveSyntax, PM_DOC.DirectiveCut, {json: true});
            });

            it('should overwrite curly cut to directive syntax', () => {
                const {serialize} = buildCheckers();
                serialize(PM_DOC.CurlyCut, MARKUP.DirectiveSyntax);
            });

            it('should serialize cut with unknown markup to directive syntax', () => {
                const {serialize} = buildCheckers();
                serialize(PM_DOC.UnknownCut, MARKUP.DirectiveSyntax);
            });

            it('should preserve directive cut syntax', () => {
                const {serialize} = buildCheckers();
                serialize(PM_DOC.DirectiveCut, MARKUP.DirectiveSyntax);
            });
        });
    });
});
