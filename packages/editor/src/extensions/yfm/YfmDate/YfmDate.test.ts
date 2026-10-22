import MarkdownIt from 'markdown-it';
import {DOMSerializer} from 'prosemirror-model';
import {builders} from 'prosemirror-test-builder';
import dd from 'ts-dedent';
import {describe, expect, it} from 'vitest';

import {parseDOM} from '../../../../tests/parse-dom';
import {createMarkupChecker} from '../../../../tests/sameMarkup';
import {DirectiveContext} from '../../../../tests/utils';
import {ExtensionsManager} from '../../../core';
import {BaseNode, BaseSchemaSpecs} from '../../base/specs';
import {BlockquoteSpecs, blockquoteNodeName} from '../../markdown/specs';
import {LabelAttr, LabelSpecs, labelNodeName} from '../Label/LabelSpecs';
import {CutAttr, CutNode, YfmCutSpecs} from '../YfmCut/YfmCutSpecs';

import {DateAttr, YfmDateSpecs, dateNodeName, datePlugin} from './YfmDateSpecs';

const {
    schema,
    markupParser: parser,
    serializer,
} = new ExtensionsManager({
    extensions: (builder) => {
        builder.context.set('directiveSyntax', new DirectiveContext(undefined));
        builder
            .use(BaseSchemaSpecs, {})
            .use(BlockquoteSpecs)
            .use(YfmCutSpecs, {})
            .use(LabelSpecs)
            .use(YfmDateSpecs);
    },
}).buildDeps();

const {doc, p, bq, cut, cutTitle, cutContent, date, label} = builders<
    'doc' | 'p' | 'bq' | 'cut' | 'cutTitle' | 'cutContent' | 'date' | 'label'
>(schema, {
    doc: {nodeType: BaseNode.Doc},
    p: {nodeType: BaseNode.Paragraph},
    bq: {nodeType: blockquoteNodeName},
    cut: {nodeType: CutNode.Cut},
    cutTitle: {nodeType: CutNode.CutTitle},
    cutContent: {nodeType: CutNode.CutContent},
    date: {nodeType: dateNodeName},
    label: {nodeType: labelNodeName},
});

const day = (value: string) => ({[DateAttr.Date]: value});

const {same, parse, serialize} = createMarkupChecker({parser, serializer});

describe('Date extension', () => {
    it.each(['2026-10-21', '2024-02-29', '2026-01-31', '2026-12-31'])(
        'should parse and serialize the day %s',
        (value) => {
            same(`:date[${value}]`, doc(p(date(day(value)))));
        },
    );

    it('should keep text around the date', () => {
        same(
            'Release on :date[2026-10-21] in the morning',
            doc(p('Release on ', date(day('2026-10-21')), ' in the morning')),
        );
    });

    it('should keep a date next to a label', () => {
        same(
            ':label[Planned]{color=blue} :date[2027-01-15]',
            doc(
                p(
                    label({[LabelAttr.Text]: 'Planned', [LabelAttr.Color]: 'blue'}),
                    ' ',
                    date(day('2027-01-15')),
                ),
            ),
        );
    });

    it.each([
        ['a day that does not exist', '2026-02-30'],
        ['a day of a common year', '2026-02-29'],
        ['another format', '21.10.2026'],
        ['an empty directive', ''],
    ])('should keep %s as plain text', (_case, value) => {
        const markup = `:date[${value}]`;
        const node = doc(p(markup));

        parse(markup, node);
        // The text serializer escapes the directive syntax, and the escaped markup is read as the same text.
        serialize(node, `\\:date\\[${value}\\]`);
        parse(`\\:date\\[${value}\\]`, node);
    });

    it('should drop attributes of the directive', () => {
        parse(':date[2026-10-21]{color=red}', doc(p(date(day('2026-10-21')))));
    });

    it('should parse the date inside a quote', () => {
        same('> :date[2026-11-01]', doc(bq(p(date(day('2026-11-01'))))));
    });

    it('should parse the date inside a cut', () => {
        same(
            dd`
            {% cut "cut title" %}

            :date[2027-03-08]

            {% endcut %}
            `.trim(),
            doc(
                cut(
                    {[CutAttr.Markup]: '{%'},
                    cutTitle('cut title'),
                    cutContent(p(date(day('2027-03-08')))),
                ),
            ),
        );
    });

    it('should not create a date node without a valid day', () => {
        const type = schema.nodes[dateNodeName];

        expect(() => type.create(day('2026-02-30')).check()).toThrow(RangeError);
        expect(() => type.create().check()).toThrow(RangeError);
    });

    it('should render the DOM of the UIKit Label on the time element', () => {
        const dom = DOMSerializer.fromSchema(schema).serializeNode(
            date(day('2026-10-21')),
        ) as HTMLElement;

        expect(dom.outerHTML).toBe(
            '<time class="g-label g-label_theme_unknown g-label_size_xs g-md-date" data-qa="date" datetime="2026-10-21">' +
                '<span class="g-label__text"><span class="g-label__content">Oct 21, 2026</span></span>' +
                '</time>',
        );
    });

    it('should render the same html in the markup and wysiwyg modes', () => {
        const dom = DOMSerializer.fromSchema(schema).serializeNode(
            date(day('2024-02-29')),
        ) as HTMLElement;
        const md = new MarkdownIt().use(datePlugin);

        expect(md.renderInline(':date[2024-02-29]')).toBe(dom.outerHTML);
    });

    it('should render an invalid directive as text', () => {
        const md = new MarkdownIt().use(datePlugin);

        expect(md.renderInline(':date[2026-02-30]')).toBe(':date[2026-02-30]');
    });

    it('should parse the date from html', () => {
        parseDOM(
            schema,
            '<p><time class="g-md-date" datetime="2026-10-21">Oct 21, 2026</time></p>',
            doc(p(date(day('2026-10-21')))),
        );
    });

    it('should not parse a date with an invalid day from html', () => {
        parseDOM(
            schema,
            '<p><time class="g-md-date" datetime="2026-02-30">Feb 30, 2026</time></p>',
            doc(p('Feb 30, 2026')),
        );
    });
});
