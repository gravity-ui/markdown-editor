import MarkdownIt from 'markdown-it';
import ins from 'markdown-it-ins';
import {describe, expect, it} from 'vitest';

import {headerPlugin} from '../directive';

import {headerContentPlugin} from './index';

const md = new MarkdownIt({html: true}).use(ins).use(headerContentPlugin);
const withHeader = new MarkdownIt().use(ins).use(headerPlugin).use(headerContentPlugin);

const content = (html: string) => `<div class="g-md-header-content-plugin">\n${html}</div>\n`;
const paragraphs = (...html: string[]) => html.map((text) => `<p>${text}</p>\n`).join('');
const header = (html: string) =>
    `<div class="g-md-header-plugin g-md-header-plugin_height_s g-md-header-plugin_width_m" data-height="s" data-width="m">\n${html}</div>\n`;

const description = paragraphs('Portal description.');
const exampleContent = ':::header-content\nPortal description.\n:::';
const contentMarkup = (texts: readonly string[]) => `:::header-content\n${texts.join('\n\n')}\n:::`;

describe('Header content Markdown', () => {
    it.each([
        [':::header-content\nPortal description.\n:::', content(description)],
        [':::header-content{}\nPortal description.\n:::', content(description)],
        [':::header-content\n\nPortal description.\n\n:::', content(description)],
        [':::header-content{size=3}\nPortal description.\n:::', content(description)],
        [":::header-content{size='4'}\nPortal description.\n:::", content(description)],
        ['  :::header-content{size="6"}\n  Portal description.\n  :::', content(description)],
        ['::::header-content\nPortal description.\n::::', content(description)],
    ])('should render the description of %j', (markup, html) => {
        expect(md.render(markup)).toBe(html);
    });

    it.each([
        ':::header-content{unknown="value"}\nPortal description.\n:::',
        ':::header-content{.custom #id}\nPortal description.\n:::',
        ':::header-content{onclick="alert(1)" style="color:red" class="x"}\nPortal description.\n:::',
        ':::header-content{color="red" level="1" href="/page"}\nPortal description.\n:::',
        ':::header-content{size="1"}\nPortal description.\n:::',
        ':::header-content{size="6" data-size="6"}\nPortal description.\n:::',
    ])('should skip an unsupported attribute in %j', (markup) => {
        expect(md.render(markup)).toBe(content(description));
    });

    it.each([
        ['bold', '**Bold**', '<strong>Bold</strong>'],
        ['italic', '*Italic* and _italic_', '<em>Italic</em> and <em>italic</em>'],
        ['underlined', '++Underlined++', '<ins>Underlined</ins>'],
        ['strikethrough', '~~Strikethrough~~', '<s>Strikethrough</s>'],
        ['monospace', '`monospace`', '<code>monospace</code>'],
        ['a link', '[Link](/page)', '<a href="/page">Link</a>'],
        [
            'a link with a title',
            '[Link](https://example.org/docs "Docs")',
            '<a href="https://example.org/docs" title="Docs">Link</a>',
        ],
        ['an anchor link', '[Link](#contacts)', '<a href="#contacts">Link</a>'],
        [
            'every mark in a link',
            '[**b** *i* ++u++ ~~s~~ `m`](/page)',
            '<a href="/page"><strong>b</strong> <em>i</em> <ins>u</ins> <s>s</s> <code>m</code></a>',
        ],
        [
            'nested marks',
            '**b *i ++u ~~s `m`~~++***',
            '<strong>b <em>i <ins>u <s>s <code>m</code></s></ins></em></strong>',
        ],
        [
            'no link with an unsafe address',
            '[Link](javascript:alert(1))',
            '[Link](javascript:alert(1))',
        ],
        ['a line break', 'First\\\nSecond', 'First<br>\nSecond'],
        ['the lines of a paragraph', 'First\nSecond', 'First\nSecond'],
        ['HTML entities and escapes', 'Q&A &copy; \\*text\\* <', 'Q&amp;A © *text* &lt;'],
    ])('should render %s in a paragraph', (_name, text, html) => {
        expect(md.render(contentMarkup([text]))).toBe(content(paragraphs(html)));
    });

    it.each([
        [1, ['One.']],
        [2, ['One.', 'Two.']],
        [3, ['One.', 'Two.', 'Three.']],
        [12, Array.from({length: 12}, (_, index) => `Paragraph ${index + 1}.`)],
    ])('should render %i paragraphs', (_count, texts) => {
        expect(md.render(contentMarkup(texts))).toBe(content(paragraphs(...texts)));
    });

    it.each([
        ['a list', '- item', '<ul>\n<li>item</li>\n</ul>\n'],
        ['a quote', '> quote', '<blockquote>\n<p>quote</p>\n</blockquote>\n'],
        ['a heading', '# Heading', '<h1>Heading</h1>\n'],
        ['a code block', '```\ncode\n```', '<pre><code>code\n</code></pre>\n'],
        ['an HTML block', '<b>bold</b>', '<p><b>bold</b></p>\n'],
        ['a description', ':::header-content\nInner\n:::', content(paragraphs('Inner'))],
    ])('should render %s in the description as written', (_name, block, html) => {
        expect(md.render(contentMarkup(['Text', block]))).toBe(content(`<p>Text</p>\n${html}`));
    });

    it.each([
        ':::header-content\n:::',
        ':::header-content\n\n:::',
        ':::header-content{size="1"}\n:::',
        ':::header-content\n   \n\n:::',
    ])('should render nothing for the empty description %j', (markup) => {
        expect(md.render(markup)).toBe('');
        expect(md.parse(markup, {}).map((token) => token.type)).toEqual([
            'header-content_open',
            'header-content_close',
        ]);
    });

    it.each([
        ':::header-content\nText',
        ':::header-content[Title]\nText\n:::',
        ':::header-content Title\nText\n:::',
        '::header-content\nText\n::',
        '::header-content[Text]',
        ':::header-contents\nText\n:::',
        '    :::header-content\n    Text\n    :::',
    ])('should leave unsupported syntax as Markdown in %j', (markup) => {
        expect(md.parse(markup, {}).some((token) => token.type.startsWith('header-content'))).toBe(
            false,
        );
        expect(md.render(markup)).not.toContain('g-md-header-content-plugin');
    });

    it('should parse the description as a container of block tokens', () => {
        const tokens = md.parse(
            'Before\n\n:::header-content{size="3"}\nFirst **bold**\n\nSecond\n:::',
            {},
        );
        expect(tokens.map((token) => token.type)).toEqual([
            'paragraph_open',
            'inline',
            'paragraph_close',
            'header-content_open',
            'paragraph_open',
            'inline',
            'paragraph_close',
            'paragraph_open',
            'inline',
            'paragraph_close',
            'header-content_close',
        ]);
        const token = tokens[3];
        expect(token.tag).toBe('div');
        expect(token.block).toBe(true);
        expect(token.nesting).toBe(1);
        expect(token.map).toEqual([2, 7]);
        expect(token.markup).toBe(':::header-content');
        expect(token.attrs).toEqual([['class', 'g-md-header-content-plugin']]);
        expect(tokens[5].content).toBe('First **bold**');
        expect(tokens[5].map).toEqual([3, 4]);
        expect(tokens[8].map).toEqual([5, 6]);
        expect(tokens[10].tag).toBe('div');
        expect(tokens[10].nesting).toBe(-1);
    });

    it.each([
        [
            'between paragraphs',
            `Before\n\n${exampleContent}\n\nAfter`,
            `<p>Before</p>\n${content(description)}<p>After</p>\n`,
        ],
        [
            'before a paragraph without an empty line',
            `${exampleContent}\nAfter`,
            `${content(description)}<p>After</p>\n`,
        ],
        [
            'in a quote',
            '> :::header-content\n> Portal description.\n> :::',
            `<blockquote>\n${content(description)}</blockquote>\n`,
        ],
        [
            'two descriptions in a row',
            `${exampleContent}\n:::header-content\nSecond\n:::`,
            content(description) + content(paragraphs('Second')),
        ],
    ])('should render the description %s', (_name, markup, html) => {
        expect(md.render(markup)).toBe(html);
    });

    it('should render once when the plugin is used several times', () => {
        const twice = new MarkdownIt().use(headerContentPlugin).use(headerContentPlugin);
        expect(twice.render(exampleContent)).toBe(content(description));
    });
});

describe('Header content in a header', () => {
    it.each([
        ['the minimal description', exampleContent, content(description)],
        [
            'the description with a size',
            ':::header-content{size="1"}\nPortal description.\n:::',
            content(description),
        ],
        [
            'three paragraphs with mixed formatting',
            contentMarkup([
                '**Welcome to the team portal.**',
                'Read the [documentation](/docs), check ++announcements++ and use `team-cli`.',
                '*Need help?* Open the [support page](/support).',
            ]),
            content(
                paragraphs(
                    '<strong>Welcome to the team portal.</strong>',
                    'Read the <a href="/docs">documentation</a>, check <ins>announcements</ins> and use <code>team-cli</code>.',
                    '<em>Need help?</em> Open the <a href="/support">support page</a>.',
                ),
            ),
        ],
        [
            'the description before a paragraph',
            `${exampleContent}\n\nText`,
            `${content(description)}<p>Text</p>\n`,
        ],
    ])('should render %s', (_name, markup, html) => {
        expect(withHeader.render(`:::header\n${markup}\n:::`)).toBe(header(html));
    });

    it('should render nothing for an empty description in a header', () => {
        expect(withHeader.render(':::header\n:::header-content\n:::\n:::')).toBe(header(''));
    });
});
