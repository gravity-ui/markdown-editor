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
import {CutAttr, CutNode, YfmCutSpecs} from '../YfmCut/YfmCutSpecs';

import {
    LabelAttr,
    LabelColor,
    LabelSpecs,
    labelColors,
    labelNodeName,
    labelPlugin,
    labelThemes,
} from './LabelSpecs';

const {
    schema,
    markupParser: parser,
    serializer,
} = new ExtensionsManager({
    extensions: (builder) => {
        builder.context.set('directiveSyntax', new DirectiveContext(undefined));
        builder.use(BaseSchemaSpecs, {}).use(BlockquoteSpecs).use(YfmCutSpecs, {}).use(LabelSpecs);
    },
}).buildDeps();

const {doc, p, bq, cut, cutTitle, cutContent, label} = builders<
    'doc' | 'p' | 'bq' | 'cut' | 'cutTitle' | 'cutContent' | 'label'
>(schema, {
    doc: {nodeType: BaseNode.Doc},
    p: {nodeType: BaseNode.Paragraph},
    bq: {nodeType: blockquoteNodeName},
    cut: {nodeType: CutNode.Cut},
    cutTitle: {nodeType: CutNode.CutTitle},
    cutContent: {nodeType: CutNode.CutContent},
    label: {nodeType: labelNodeName},
});

const attrs = (text: string, color: LabelColor) => ({
    [LabelAttr.Text]: text,
    [LabelAttr.Color]: color,
});

const {same, parse, serialize} = createMarkupChecker({parser, serializer});

describe('Label extension', () => {
    it('should expose the neutral color and five semantic colors in the palette order', () => {
        expect(labelColors).toEqual(['gray', 'green', 'yellow', 'blue', 'red', 'purple']);
    });

    it('should map every color to a theme of the UIKit Label', () => {
        expect(labelThemes).toEqual({
            gray: 'unknown',
            green: 'success',
            yellow: 'warning',
            blue: 'info',
            red: 'danger',
            purple: 'utility',
        });
    });

    it.each(labelColors)('should parse and serialize the %s color', (color) => {
        const markup =
            color === LabelColor.Gray
                ? ':label[In progress]'
                : `:label[In progress]{color=${color}}`;

        same(markup, doc(p(label(attrs('In progress', color)))));
    });

    it('should keep text around the label', () => {
        same(
            'Task is :label[done]{color=green} already',
            doc(p('Task is ', label(attrs('done', LabelColor.Green)), ' already')),
        );
    });

    it('should read the former status directive and write the label directive', () => {
        const node = doc(p('Task is ', label(attrs('done', LabelColor.Green)), ' already'));

        parse('Task is :status[done]{color=green} already', node);
        serialize(node, 'Task is :label[done]{color=green} already');
    });

    it.each([
        ['teal', LabelColor.Blue],
        ['lime', LabelColor.Green],
        ['orange', LabelColor.Yellow],
        ['magenta', LabelColor.Purple],
    ])('should map the former %s color to %s', (legacyColor, color) => {
        const node = doc(p(label(attrs('In progress', color))));

        parse(`:status[In progress]{color=${legacyColor}}`, node);
        serialize(node, `:label[In progress]{color=${color}}`);
    });

    it.each(['pink', 'constructor', 'toString'])(
        'should fall back to the gray color for the unknown value %s',
        (unknownColor) => {
            const node = doc(p(label(attrs('In progress', LabelColor.Gray))));

            parse(`:label[In progress]{color=${unknownColor}}`, node);
            serialize(node, ':label[In progress]');
        },
    );

    it('should escape brackets and backslashes in the caption', () => {
        same(':label[a\\] b \\\\ c]', doc(p(label(attrs('a] b \\ c', LabelColor.Gray)))));
    });

    it('should keep the caption of the former directive with escapes', () => {
        const node = doc(p(label(attrs('a] b \\ c', LabelColor.Gray))));

        parse(':status[a\\] b \\\\ c]', node);
        serialize(node, ':label[a\\] b \\\\ c]');
    });

    it('should keep markup characters in the caption as plain text', () => {
        same(
            ':label[**bold** _and_ `code`]{color=red}',
            doc(p(label(attrs('**bold** _and_ `code`', LabelColor.Red)))),
        );
    });

    it('should parse the label inside a quote', () => {
        same(
            '> :label[On review]{color=blue}',
            doc(bq(p(label(attrs('On review', LabelColor.Blue))))),
        );
    });

    it('should parse the label inside a cut', () => {
        same(
            dd`
            {% cut "cut title" %}

            :label[On review]{color=blue}

            {% endcut %}
            `.trim(),
            doc(
                cut(
                    {[CutAttr.Markup]: '{%'},
                    cutTitle('cut title'),
                    cutContent(p(label(attrs('On review', LabelColor.Blue)))),
                ),
            ),
        );
    });

    it('should render the DOM of the UIKit Label', () => {
        const dom = DOMSerializer.fromSchema(schema).serializeNode(
            label(attrs('In progress', LabelColor.Green)),
        ) as HTMLElement;

        expect(dom.outerHTML).toBe(
            '<span class="g-label g-label_theme_success g-label_size_xs g-md-label" data-qa="label" data-color="green">' +
                '<span class="g-label__text"><span class="g-label__content">In progress</span></span>' +
                '</span>',
        );
    });

    it('should render the same html in the markup and wysiwyg modes', () => {
        const node = label(attrs('In progress', LabelColor.Green));
        const dom = DOMSerializer.fromSchema(schema).serializeNode(node) as HTMLElement;
        const md = new MarkdownIt().use(labelPlugin);

        expect(md.renderInline(':label[In progress]{color=green}')).toBe(dom.outerHTML);
        expect(md.renderInline(':status[In progress]{color=green}')).toBe(dom.outerHTML);
    });

    it('should escape html in the rendered caption', () => {
        const html = new MarkdownIt().use(labelPlugin).renderInline(':label[<b>x</b>]');

        expect(html).toContain('<span class="g-label__content">&lt;b&gt;x&lt;/b&gt;</span>');
    });

    it('should parse the label from html', () => {
        parseDOM(
            schema,
            '<p><span class="g-label g-label_theme_success g-label_size_xs g-md-label" data-color="green"><span class="g-label__text"><span class="g-label__content">Done</span></span></span></p>',
            doc(p(label(attrs('Done', LabelColor.Green)))),
        );
    });

    it('should map a former color in html', () => {
        parseDOM(
            schema,
            '<p><span class="g-md-label" data-color="teal">Done</span></p>',
            doc(p(label(attrs('Done', LabelColor.Blue)))),
        );
    });
});

describe('Label caption round trip', () => {
    it.each(['[', '[x]', 'a [b', 'a [b] c', 'a] \\ [b]'])(
        'should preserve the caption %s',
        (caption) => {
            const pmDoc = doc(p(label(attrs(caption, LabelColor.Green))));
            const markup = serializer.serialize(pmDoc);
            expect(parser.parse(markup)).toMatchNode(pmDoc);
            expect(new MarkdownIt().use(labelPlugin).renderInline(markup)).toContain(
                'g-label_theme_success',
            );
        },
    );
});

describe('Empty label serialization', () => {
    it.each(['', '  '])('should omit an unfinished empty caption %j when saving', (caption) => {
        serialize(doc(p('a', label(attrs(caption, LabelColor.Blue)), 'b')), 'ab');
    });
});

describe('Label placeholder', () => {
    it('should keep the visual placeholder out of attributes and copied text', () => {
        const node = label(attrs('', LabelColor.Gray));
        const dom = DOMSerializer.fromSchema(schema).serializeNode(node) as HTMLElement;
        expect(dom.textContent).toBe('');
        expect(dom.querySelector('[data-placeholder]')).not.toBeNull();
        parseDOM(schema, `<p>${dom.outerHTML}</p>`, doc(p(node)));
    });
    it('should preserve a real caption equal to the placeholder', () => {
        const node = label(attrs('Set status', LabelColor.Gray));
        const dom = DOMSerializer.fromSchema(schema).serializeNode(node) as HTMLElement;
        expect(dom.querySelector('[data-placeholder]')).toBeNull();
        parseDOM(schema, `<p>${dom.outerHTML}</p>`, doc(p(node)));
    });
});
