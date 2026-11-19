import MarkdownIt from 'markdown-it';
import {describe, expect, it} from 'vitest';

import {headerTitleTokenName} from '../header-title/model';
import {headerContentPlugin, headerPlugin, headerTitlePlugin} from '../index';

import {headerContentClassName, headerContentTokenName} from './model';

const md = new MarkdownIt({html: true}).use(headerContentPlugin);
const withHeader = new MarkdownIt().use(headerPlugin).use(headerContentPlugin);
const contentOpen = `${headerContentTokenName}_open`;
const contentClose = `${headerContentTokenName}_close`;

const content = (html: string) => `<div class="g-md-header-content-plugin">\n${html}</div>\n`;
const paragraphs = (...html: string[]) => html.map((text) => `<p>${text}</p>\n`).join('');
const header = (html: string) =>
    `<div class="g-md-header-plugin g-md-header-plugin_height_s g-md-header-plugin_width_m" data-height="s" data-width="m">\n${html}</div>\n`;

const description = paragraphs('Portal description.');
const exampleContent = ':::header-content\nPortal description.\n:::';
const contentMarkup = (texts: readonly string[]) => `:::header-content\n${texts.join('\n\n')}\n:::`;
const inHeader = (...blocks: string[]) => `:::header\n${blocks.join('\n\n')}\n:::`;
const contentTokens = (markup: string, parser = withHeader) =>
    parser.parse(markup, {}).filter((token) => token.type.startsWith(headerContentTokenName));

describe('Header content Markdown', () => {
    it.each([
        ':::header-content\nPortal description.\n:::',
        ':::header-content{}\nPortal description.\n:::',
        ':::header-content\n\nPortal description.\n\n:::',
        '  :::header-content\n  Portal description.\n  :::',
        '::::header-content\nPortal description.\n::::',
    ])('should render the description of %j', (markup) => {
        expect(md.render(markup)).toBe(content(description));
    });

    it.each([
        ':::header-content{size="1"}\nPortal description.\n:::',
        ':::header-content{size=3}\nPortal description.\n:::',
        ':::header-content{unknown="value"}\nPortal description.\n:::',
        ':::header-content{.custom #id}\nPortal description.\n:::',
        ':::header-content{onclick="alert(1)" style="color:red" class="x"}\nPortal description.\n:::',
        ':::header-content{color="red" level="1" href="/page"}\nPortal description.\n:::',
    ])('should skip the attributes of %j', (markup) => {
        expect(md.render(markup)).toBe(content(description));
        expect(md.parse(markup, {})[0].attrs).toEqual([['class', headerContentClassName]]);
    });

    it.each([
        ['bold', '**Bold**', '<strong>Bold</strong>'],
        ['italic', '*Italic* and _italic_', '<em>Italic</em> and <em>italic</em>'],
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
            '[**b** *i* ~~s~~ `m`](/page)',
            '<a href="/page"><strong>b</strong> <em>i</em> <s>s</s> <code>m</code></a>',
        ],
        [
            'nested marks',
            '**b *i ~~s `m`~~***',
            '<strong>b <em>i <s>s <code>m</code></s></em></strong>',
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
        [12, Array.from({length: 12}, (_, index) => `Paragraph ${index + 1}.`)],
    ])('should render %i paragraphs', (_count, texts) => {
        expect(md.render(contentMarkup(texts))).toBe(content(paragraphs(...texts)));
    });

    it.each([
        ['a list', '- item', '<ul>\n<li>item</li>\n</ul>\n'],
        ['a quote', '> quote', '<blockquote>\n<p>quote</p>\n</blockquote>\n'],
        ['a heading', '# Heading', '<h1>Heading</h1>\n'],
        ['a code block', '```\ncode\n```', '<pre><code>code\n</code></pre>\n'],
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
            contentOpen,
            contentClose,
        ]);
    });

    it.each([
        ':::header-content\nText',
        ':::header-content[Title]\nText\n:::',
        ':::header-content Title\nText\n:::',
        ':::header-content(/page)\nText\n:::',
        '::header-content\nText\n::',
        '::header-content[Text]',
        ':::header-contents\nText\n:::',
        '    :::header-content\n    Text\n    :::',
    ])('should leave unsupported syntax as Markdown in %j', (markup) => {
        expect(contentTokens(markup, md)).toEqual([]);
        expect(md.render(markup)).not.toContain(headerContentClassName);
    });

    it('should parse the description as a container of block tokens', () => {
        const tokens = md.parse('Before\n\n:::header-content\nFirst **bold**\n\nSecond\n:::', {});
        expect(tokens.map((token) => token.type)).toEqual([
            'paragraph_open',
            'inline',
            'paragraph_close',
            contentOpen,
            'paragraph_open',
            'inline',
            'paragraph_close',
            'paragraph_open',
            'inline',
            'paragraph_close',
            contentClose,
        ]);
        const token = tokens[3];
        expect(token.tag).toBe('div');
        expect(token.block).toBe(true);
        expect(token.map).toEqual([2, 7]);
        expect(token.markup).toBe(':::header-content');
        expect(tokens[5].content).toBe('First **bold**');
        expect(tokens[10].tag).toBe('div');
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
            'twice in a row',
            `${exampleContent}\n:::header-content\nSecond\n:::`,
            content(description) + content(paragraphs('Second')),
        ],
    ])('should render the description outside a header %s', (_name, markup, html) => {
        expect(md.render(markup)).toBe(html);
        expect(withHeader.render(markup)).toBe(html);
    });

    it('should render once when the plugin is used several times', () => {
        const twice = new MarkdownIt()
            .use(headerPlugin)
            .use(headerContentPlugin)
            .use(headerContentPlugin);
        expect(twice.render(exampleContent)).toBe(content(description));
        expect(twice.render(inHeader(exampleContent, exampleContent))).toBe(
            header(content(description) + description),
        );
    });
});

describe('Header content in a header', () => {
    it.each([
        ['the minimal description', [exampleContent], content(description)],
        [
            'three paragraphs with mixed formatting',
            [
                contentMarkup([
                    '**Welcome to the team portal.**',
                    'Read the [documentation](/docs) and use `team-cli`.',
                    '*Need help?* Open the [support page](/support).',
                ]),
            ],
            content(
                paragraphs(
                    '<strong>Welcome to the team portal.</strong>',
                    'Read the <a href="/docs">documentation</a> and use <code>team-cli</code>.',
                    '<em>Need help?</em> Open the <a href="/support">support page</a>.',
                ),
            ),
        ],
        [
            'the description between paragraphs',
            ['Before', exampleContent, 'After'],
            `<p>Before</p>\n${content(description)}<p>After</p>\n`,
        ],
    ])('should render %s', (_name, blocks, html) => {
        expect(withHeader.render(inHeader(...blocks))).toBe(header(html));
    });

    it('should render nothing for an empty description in a header', () => {
        expect(withHeader.render(inHeader(':::header-content\n:::'))).toBe(header(''));
    });

    it.each([
        [
            'a second description',
            [exampleContent, contentMarkup(['Second.'])],
            content(description) + paragraphs('Second.'),
        ],
        [
            'a second empty description',
            [exampleContent, ':::header-content\n:::'],
            content(description),
        ],
        [
            'a description after an empty one',
            [':::header-content\n:::', exampleContent],
            description,
        ],
        [
            'a description in a description',
            [contentMarkup(['Text', contentMarkup(['Inner.'])])],
            content(paragraphs('Text', 'Inner.')),
        ],
        [
            'a description in a quote',
            ['> :::header-content\n> Quoted.\n> :::', exampleContent],
            `<blockquote>\n${paragraphs('Quoted.')}</blockquote>\n${content(description)}`,
        ],
    ])('should keep only the blocks of %s', (_name, blocks, html) => {
        expect(withHeader.render(inHeader(...blocks))).toBe(header(html));
    });

    it('should keep one description in each header', () => {
        const markup = [
            inHeader(exampleContent, exampleContent),
            inHeader(exampleContent),
            exampleContent,
        ].join('\n\n');
        expect(contentTokens(markup).map((token) => token.type)).toEqual([
            contentOpen,
            contentClose,
            contentOpen,
            contentClose,
            contentOpen,
            contentClose,
        ]);
    });

    it('should keep a title of a second description as text in a banner with a title', () => {
        const parser = new MarkdownIt()
            .use(headerPlugin)
            .use(headerTitlePlugin)
            .use(headerContentPlugin);
        const markup = inHeader(
            '::header-title[First]',
            exampleContent,
            contentMarkup(['::header-title[Second]', 'More text.']),
        );
        const tokens = parser.parse(markup, {});
        expect(tokens.filter((token) => token.type === headerTitleTokenName)).toHaveLength(1);
        expect(parser.render(markup)).toBe(
            parser.render(
                inHeader(
                    '::header-title[First]',
                    exampleContent,
                    '::header-title[Second]',
                    'More text.',
                ),
            ),
        );
    });

    it('should keep the token stream balanced after removing a description', () => {
        const tokens = withHeader.parse(
            inHeader(exampleContent, contentMarkup(['Second.']), 'After'),
            {},
        );
        let depth = 0;
        for (const token of tokens) {
            depth += token.nesting;
            expect(depth).toBeGreaterThanOrEqual(0);
        }
        expect(depth).toBe(0);
        expect(tokens.map((token) => token.type).slice(-4)).toEqual([
            'paragraph_open',
            'inline',
            'paragraph_close',
            'g_md_header_close',
        ]);
    });
});
