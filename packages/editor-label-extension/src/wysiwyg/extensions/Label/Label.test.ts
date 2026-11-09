// @vitest-environment jsdom
import {ExtensionsManager} from '@gravity-ui/markdown-editor/core';
import {DOMParser, DOMSerializer, type Node} from '@gravity-ui/markdown-editor/pm/model';
import {builders} from '@gravity-ui/markdown-editor/pm/test-builder';
import {Transform} from '@gravity-ui/markdown-editor/pm/transform';
import {
    BaseNode,
    BaseSchemaSpecs,
    BlockquoteSpecs,
    HeadingSpecs,
    ListsSpecs,
    TableSpecs,
    YfmTableSpecs,
    blockquoteNodeName,
} from '@gravity-ui/markdown-editor/specs';
import {type LabelColor, labelColors, labelPlugin} from '@gravity-ui/markdown-plugin-label';
import MarkdownIt from 'markdown-it';
import {describe, expect, it} from 'vitest';

import {LabelAttr, LabelSpecs, labelNodeName} from './LabelSpecs';

const {schema, markupParser, serializer} = new ExtensionsManager({
    extensions: (builder) =>
        builder
            .use(BaseSchemaSpecs, {})
            .use(BlockquoteSpecs)
            .use(HeadingSpecs, {})
            .use(ListsSpecs, {})
            .use(TableSpecs, {})
            .use(YfmTableSpecs, {})
            .use(LabelSpecs),
}).buildDeps();

const {doc, p, bq, label} = builders<'doc' | 'p' | 'bq' | 'label'>(schema, {
    doc: {nodeType: BaseNode.Doc},
    p: {nodeType: BaseNode.Paragraph},
    bq: {nodeType: blockquoteNodeName},
    label: {nodeType: labelNodeName},
});

const attrs = (text: string, color: LabelColor) => ({
    [LabelAttr.Text]: text,
    [LabelAttr.Color]: color,
});

const expectSameNode = (actual: Node, expected: Node) =>
    expect(actual.toJSON()).toEqual(expected.toJSON());

const parse = (markup: string, expected: Node) =>
    expectSameNode(markupParser.parse(markup), expected);
const serialize = (node: Node, expected: string) =>
    expect(serializer.serialize(node)).toBe(expected);
const same = (markup: string, node: Node) => {
    parse(markup, node);
    serialize(node, markup);
};

const labelsOf = (node: Node) => {
    const labels: unknown[] = [];
    node.descendants((child) => {
        if (child.type.name === labelNodeName) labels.push(child.attrs);
    });
    return labels;
};

/** Parses the markup, saves it and parses the result again. */
const expectRoundTrip = (markup: string, labels: unknown[]) => {
    const node = markupParser.parse(markup);
    const saved = serializer.serialize(node);

    expect(labelsOf(node)).toEqual(labels);
    expectSameNode(markupParser.parse(saved), node);
    return saved;
};

const toDom = (node: Node) => DOMSerializer.fromSchema(schema).serializeNode(node) as HTMLElement;

const parseHtml = (html: string, expected: Node) => {
    const container = document.createElement('div');
    container.innerHTML = html;
    expectSameNode(DOMParser.fromSchema(schema).parse(container), expected);
};

describe('Label extension', () => {
    it.each(labelColors)('should parse and serialize the %s color', (color) => {
        const markup =
            color === 'gray' ? ':label[In progress]' : `:label[In progress]{color=${color}}`;

        same(markup, doc(p(label(attrs('In progress', color)))));
    });

    it('should keep text around the label', () => {
        same(
            'Task is :label[done]{color=green} already',
            doc(p('Task is ', label(attrs('done', 'green')), ' already')),
        );
    });

    it('should write the former status directive as a label', () => {
        const node = doc(p(label(attrs('done', 'green'))));

        parse(':status[done]{color=green}', node);
        serialize(node, ':label[done]{color=green}');
    });

    it('should write gray for an unsupported color', () => {
        const node = doc(p(label(attrs('In progress', 'gray'))));

        parse(':label[In progress]{color=pink}', node);
        serialize(node, ':label[In progress]');
    });

    it('should escape brackets and backslashes in the caption', () => {
        same(':label[a\\] b \\\\ c]', doc(p(label(attrs('a] b \\ c', 'gray')))));
    });

    it('should keep markup characters in the caption as plain text', () => {
        same(
            ':label[**bold** _and_ `code`]{color=red}',
            doc(p(label(attrs('**bold** _and_ `code`', 'red')))),
        );
    });

    it('should parse the label inside a quote', () => {
        same('> :label[On review]{color=blue}', doc(bq(p(label(attrs('On review', 'blue'))))));
    });

    it.each([
        '[',
        '[x]',
        'a [b',
        'a [b] c',
        'a] \\ [b]',
        'a|b',
        'a&amp;b',
        '&#123;',
        '&copy',
        'R&D',
        '{color=red}',
        ':label[x]',
    ])('should preserve the caption %s', (caption) => {
        const node = doc(p(label(attrs(caption, 'green'))));
        parse(serializer.serialize(node), node);
    });

    it('should escape a pipe in the caption', () => {
        same(':label[a\\|b]', doc(p(label(attrs('a|b', 'gray')))));
    });

    it('should escape an ampersand only before an HTML entity', () => {
        same(':label[\\&amp; R&D]', doc(p(label(attrs('&amp; R&D', 'gray')))));
    });

    it('should decode an HTML entity in the caption', () => {
        parse(':label[a&amp;b &#123;]', doc(p(label(attrs('a&b {', 'gray')))));
    });

    it('should keep a pipe in the caption inside a table', () => {
        const saved = expectRoundTrip('| a | b |\n|---|---|\n| :label[x\\|y]{color=red} | c |', [
            attrs('x|y', 'red'),
        ]);

        expect(saved).toContain(':label[x\\|y]{color=red}|c|');
    });

    it('should keep a pipe in the caption inside a YFM table', () => {
        expectRoundTrip('#|\n|| :label[x\\|y]{color=red} | b ||\n|#', [attrs('x|y', 'red')]);
    });

    it('should keep a table row when the caption has a line break', () => {
        const table = markupParser.parse('| a | b |\n|---|---|\n| :label[x]{color=red} | c |');
        let pos = -1;
        table.descendants((child, offset) => {
            if (child.type.name === labelNodeName) pos = offset;
        });
        const node = new Transform(table).setNodeMarkup(pos, null, attrs('x\ny', 'red')).doc;

        expect(serializer.serialize(node)).toContain('|:label[x y]{color=red}|c|');
    });

    it.each([
        ['heading', '# Release :label[Done]{color=green}'],
        ['bullet list', '- :label[Done]{color=green} task'],
        ['ordered list', '1. task :label[Done]{color=green}'],
        ['nested quote', '> - > :label[Done]{color=green}'],
    ])('should keep the label in a %s', (_, markup) => {
        expect(expectRoundTrip(markup, [attrs('Done', 'green')])).toBe(markup);
    });

    it('should keep text in braces after a gray label as text', () => {
        same(':label[x]\\{color=red\\}', doc(p(label(attrs('x', 'gray')), '{color=red}')));
    });

    it('should keep a long caption on one line', () => {
        const caption = 'word '.repeat(100).trim();
        same(`:label[${caption}]{color=blue}`, doc(p(label(attrs(caption, 'blue')))));
    });

    it.each(['', '  '])('should omit an empty caption %j when saving', (caption) => {
        serialize(doc(p('a', label(attrs(caption, 'blue')), 'b')), 'ab');
    });

    it('should render the same html in the markup and wysiwyg modes', () => {
        const md = new MarkdownIt().use(labelPlugin);

        expect(md.renderInline(':label[In progress]{color=green}')).toBe(
            toDom(label(attrs('In progress', 'green'))).outerHTML,
        );
    });

    it('should parse the label from html', () => {
        parseHtml(
            '<p><span class="g-md-label-plugin g-md-label-plugin_color_green" data-color="green"><span class="g-md-label-plugin__text">Done</span></span></p>',
            doc(p(label(attrs('Done', 'green')))),
        );
    });

    it('should map a former color in html', () => {
        parseHtml(
            '<p><span class="g-md-label-plugin" data-color="teal">Done</span></p>',
            doc(p(label(attrs('Done', 'blue')))),
        );
    });

    it('should keep the placeholder out of attributes and copied text', () => {
        const node = label(attrs('', 'gray'));
        const dom = toDom(node);

        expect(dom.textContent).toBe('');
        expect(dom.querySelector('[data-placeholder]')).not.toBeNull();
        parseHtml(`<p>${dom.outerHTML}</p>`, doc(p(node)));
    });

    it('should preserve a caption equal to the placeholder', () => {
        const node = label(attrs('Set status', 'gray'));
        const dom = toDom(node);

        expect(dom.querySelector('[data-placeholder]')).toBeNull();
        parseHtml(`<p>${dom.outerHTML}</p>`, doc(p(node)));
    });
});
