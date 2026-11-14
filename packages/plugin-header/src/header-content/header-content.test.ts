import MarkdownIt from 'markdown-it';
import ins from 'markdown-it-ins';
import {describe, expect, it} from 'vitest';

import {
    type NestedMark,
    contentMarkup,
    descriptionExamples,
    descriptionMarkup,
    example,
    exampleButtons,
    exampleContent,
    exampleImage,
    exampleTitle,
    header,
    mixedExamples,
    mixedMarkup,
    nestedExamples,
    nestedMarkup,
    nestedParagraphsMarkup,
    structureExamples,
    structureMarkup,
} from '../../tests/examples';
import {headerPreset} from '../preset';

import {
    headerContent,
    headerContentAttrs,
    headerContentFromAttrs,
    headerContentPlugin,
    headerContentSizes,
    headerContentValues,
} from './index';

// `++underlined++` is not CommonMark: the editor and YFM read it with this plugin.
const md = new MarkdownIt({html: true}).use(ins).use(headerContentPlugin);
const preset = new MarkdownIt().use(ins).use(headerPreset);

/** The description with the given size around the rendered paragraphs. */
const content = (html: string, size?: number | string) =>
    `<div class="g-md-header-content-plugin${size === undefined ? '' : ` g-md-header-content-plugin_size_${size}" data-size="${size}`}">\n${html}</div>\n`;
/** The paragraphs of a description. */
const paragraphs = (...html: string[]) => html.map((text) => `<p>${text}</p>\n`).join('');
/** The descriptions of a rendered document. */
const contents = (output: string) =>
    output.match(/<div class="g-md-header-content-plugin[^>]*>\n[\s\S]*?<\/div>\n/g) ?? [];

const description = paragraphs('Portal description.');
const secondParagraph =
    'Second paragraph with a <a href="/page">link</a>, <strong>bold</strong>, <em>italic</em>, <s>strikethrough</s> and <code>monospace</code> text.';
const title =
    '<div class="g-md-header-title-plugin g-md-header-title-plugin_size_2" role="heading" aria-level="2">Team portal</div>\n';

// The rendered texts of the nested examples.
const nestedMarksHtml: Record<NestedMark, string> = {
    bold: '<strong>Bold text.</strong>',
    italic: '<em>Italic text.</em>',
    underline: '<ins>Underlined text.</ins>',
    strike: '<s>Strikethrough text.</s>',
    code: '<code>inline code</code>',
    link: '<a href="/page">Team page</a>',
};

describe('Header content Markdown', () => {
    it.each([
        [
            1,
            '<div class="g-md-header-content-plugin g-md-header-content-plugin_size_1" data-size="1">\n<p>Text</p>\n</div>\n',
        ],
        [
            2,
            '<div class="g-md-header-content-plugin g-md-header-content-plugin_size_2" data-size="2">\n<p>Text</p>\n</div>\n',
        ],
        [
            3,
            '<div class="g-md-header-content-plugin g-md-header-content-plugin_size_3" data-size="3">\n<p>Text</p>\n</div>\n',
        ],
        [
            4,
            '<div class="g-md-header-content-plugin g-md-header-content-plugin_size_4" data-size="4">\n<p>Text</p>\n</div>\n',
        ],
        [
            5,
            '<div class="g-md-header-content-plugin g-md-header-content-plugin_size_5" data-size="5">\n<p>Text</p>\n</div>\n',
        ],
        [
            6,
            '<div class="g-md-header-content-plugin g-md-header-content-plugin_size_6" data-size="6">\n<p>Text</p>\n</div>\n',
        ],
    ])('should render size %s with its modifier', (size, html) => {
        expect(md.render(`:::header-content{size="${size}"}\nText\n:::`)).toBe(html);
    });

    it.each([
        [':::header-content\nPortal description.\n:::', content(description)],
        [':::header-content{}\nPortal description.\n:::', content(description)],
        [':::header-content\n\nPortal description.\n\n:::', content(description)],
        [':::header-content{size=3}\nPortal description.\n:::', content(description, 3)],
        [":::header-content{size='4'}\nPortal description.\n:::", content(description, 4)],
        ['  :::header-content{size="6"}\n  Portal description.\n  :::', content(description, 6)],
        ['::::header-content\nPortal description.\n::::', content(description)],
    ])(
        'should render regular text without a size and read the attributes of %j',
        (markup, html) => {
            expect(md.render(markup)).toBe(html);
        },
    );

    it.each([
        ':::header-content{unknown="value"}\nPortal description.\n:::',
        ':::header-content{.custom #id}\nPortal description.\n:::',
        ':::header-content{onclick="alert(1)" style="color:red" class="x"}\nPortal description.\n:::',
        ':::header-content{color="red" level="1" href="/page"}\nPortal description.\n:::',
    ])('should skip an unsupported attribute in %j', (markup) => {
        expect(md.render(markup)).toBe(content(description));
    });

    it.each([
        '0',
        '7',
        '1.0',
        '01',
        ' 1',
        'h1',
        'l',
        '',
        '<script>alert(1)</script>',
        '1" size="3',
    ])('should render regular text for the unsupported size %j', (size) => {
        expect(md.render(`:::header-content{size="${size}"}\nPortal description.\n:::`)).toBe(
            content(description),
        );
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
        expect(md.render(contentMarkup(texts, 2))).toBe(content(paragraphs(...texts), 2));
    });

    // Dropping other blocks from the description is a separate task: they render as written.
    it.each([
        ['a list', '- item', '<ul>\n<li>item</li>\n</ul>\n'],
        ['a quote', '> quote', '<blockquote>\n<p>quote</p>\n</blockquote>\n'],
        ['a heading', '# Heading', '<h1>Heading</h1>\n'],
        ['a code block', '```\ncode\n```', '<pre><code>code\n</code></pre>\n'],
        ['an HTML block', '<b>bold</b>', '<p><b>bold</b></p>\n'],
        [
            'a description',
            ':::header-content{size="1"}\nInner\n:::',
            content(paragraphs('Inner'), 1),
        ],
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
        // The tokens stay for a parser of the token stream.
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
        expect(token.attrGet('data-size')).toBe('3');
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
            `${exampleContent}\n:::header-content{size="1"}\nSecond\n:::`,
            content(description) + content(paragraphs('Second'), 1),
        ],
    ])('should render the description %s', (_name, markup, html) => {
        expect(md.render(markup)).toBe(html);
    });

    it('should render once when the plugin is used several times', () => {
        const twice = new MarkdownIt().use(headerContentPlugin).use(headerContentPlugin);
        expect(twice.render(exampleContent)).toBe(content(description));
    });
});

describe('Header content options', () => {
    it.each([
        [{}, {size: null}, {}],
        [{size: '1'}, {size: 1}, {size: '1'}],
        [{size: 2}, {size: 2}, {size: '2'}],
        [{size: '6'}, {size: 6}, {size: '6'}],
        [{size: 0}, {size: null}, {}],
        [{size: 1.5}, {size: null}, {}],
        [{size: '7'}, {size: null}, {}],
        [{size: ['1', '2']}, {size: null}, {}],
        [{size: null}, {size: null}, {}],
        [{size: undefined}, {size: null}, {}],
    ])('should resolve the options of %j', (attrs, options, values) => {
        expect(headerContent(attrs)).toEqual(options);
        expect(headerContentValues(headerContent(attrs))).toEqual(values);
    });

    it.each([null, ...headerContentSizes].map((size) => ({size})))(
        'should read size $size back from the rendered attributes',
        (options) => {
            const attrs = headerContentAttrs(options);
            expect(headerContentFromAttrs((name) => attrs[name])).toEqual(options);
        },
    );

    it('should read the default from an element without the attributes', () => {
        expect(headerContentFromAttrs(() => null)).toEqual({size: null});
    });

    it.each([
        [{}, {class: 'g-md-header-content-plugin'}],
        [
            {size: 1},
            {
                class: 'g-md-header-content-plugin g-md-header-content-plugin_size_1',
                'data-size': '1',
            },
        ],
        [
            {size: '4'},
            {
                class: 'g-md-header-content-plugin g-md-header-content-plugin_size_4',
                'data-size': '4',
            },
        ],
        [{size: '9'}, {class: 'g-md-header-content-plugin'}],
    ])('should build the attributes of %j', (options, attrs) => {
        expect(headerContentAttrs(options)).toEqual(attrs);
    });
});

describe('Header content syntax examples', () => {
    it.each(descriptionExamples(headerContentSizes))(
        'should render $id with size $size and $paragraphs paragraphs',
        (item) => {
            expect(preset.render(descriptionMarkup(item))).toBe(
                header(
                    content(
                        paragraphs(
                            ...['Portal description.', secondParagraph].slice(0, item.paragraphs),
                        ),
                        item.size === 'omitted' ? undefined : item.size,
                    ),
                ),
            );
        },
    );

    it.each(nestedExamples)('should render $id with the marks $marks', (item) => {
        expect(preset.render(nestedMarkup(item))).toBe(
            header(
                title +
                    content(
                        paragraphs(
                            [
                                'Plain text.',
                                ...item.marks.map((mark) => nestedMarksHtml[mark]),
                            ].join(' '),
                        ),
                    ),
            ),
        );
    });

    it.each([
        [
            'nested-065',
            'a relative link',
            ['Visit the [team page](/page).'],
            ['Visit the <a href="/page">team page</a>.'],
        ],
        [
            'nested-066',
            'an absolute link',
            ['Read the [public documentation](https://example.org/docs).'],
            ['Read the <a href="https://example.org/docs">public documentation</a>.'],
        ],
        [
            'nested-067',
            'an anchor link',
            ['Jump to the [contacts section](#contacts).'],
            ['Jump to the <a href="#contacts">contacts section</a>.'],
        ],
        [
            'nested-068',
            'several links',
            ['Open the [team page](/page) or the [documentation](https://example.org/docs).'],
            [
                'Open the <a href="/page">team page</a> or the <a href="https://example.org/docs">documentation</a>.',
            ],
        ],
        [
            'nested-069',
            'bold text inside a link',
            ['Read the [**team documentation**](/docs).'],
            ['Read the <a href="/docs"><strong>team documentation</strong></a>.'],
        ],
        [
            'nested-070',
            'italic text inside a link',
            ['Open the [*team page*](/page).'],
            ['Open the <a href="/page"><em>team page</em></a>.'],
        ],
        [
            'nested-071',
            'a link inside bold text',
            ['**Read the [team documentation](/docs) before publishing.**'],
            ['<strong>Read the <a href="/docs">team documentation</a> before publishing.</strong>'],
        ],
        [
            'nested-072',
            'a link inside italic text',
            ['*See the [team page](/page) for details.*'],
            ['<em>See the <a href="/page">team page</a> for details.</em>'],
        ],
        [
            'nested-073',
            'a link inside underlined text',
            ['++Open the [team page](/page).++'],
            ['<ins>Open the <a href="/page">team page</a>.</ins>'],
        ],
        [
            'nested-074',
            'a link inside strikethrough text',
            ['~~See the [old page](/old-page).~~'],
            ['<s>See the <a href="/old-page">old page</a>.</s>'],
        ],
        [
            'nested-075',
            'nested bold and italic',
            ['**Important: *read this first* and visit the [team page](/page).**'],
            [
                '<strong>Important: <em>read this first</em> and visit the <a href="/page">team page</a>.</strong>',
            ],
        ],
        [
            'nested-076',
            'two paragraphs with links',
            [
                'Open the [team page](/page).',
                'Read the [documentation](https://example.org/docs) and **contact the team**.',
            ],
            [
                'Open the <a href="/page">team page</a>.',
                'Read the <a href="https://example.org/docs">documentation</a> and <strong>contact the team</strong>.',
            ],
        ],
        [
            'nested-077',
            'three paragraphs with mixed formatting',
            [
                '**Welcome to the team portal.**',
                'Read the [documentation](/docs), check ++announcements++ and use `team-cli`.',
                '*Need help?* Open the [support page](/support).',
            ],
            [
                '<strong>Welcome to the team portal.</strong>',
                'Read the <a href="/docs">documentation</a>, check <ins>announcements</ins> and use <code>team-cli</code>.',
                '<em>Need help?</em> Open the <a href="/support">support page</a>.',
            ],
        ],
    ])('should render %s with %s', (_id, _name, texts, html) => {
        expect(preset.render(nestedParagraphsMarkup(texts))).toBe(
            header(title + content(paragraphs(...html))),
        );
    });

    it('should render nested-078 with a rich description among the other blocks', () => {
        const output = preset.render(
            example(
                '',
                exampleImage,
                exampleTitle,
                contentMarkup([
                    '**Team resources:** [documentation](/docs), [contacts](/contacts) and ++announcements++.',
                    'Use `team-cli` for routine tasks. *Read the documentation first.*',
                ]),
                ...exampleButtons,
            ),
        );
        const html = content(
            paragraphs(
                '<strong>Team resources:</strong> <a href="/docs">documentation</a>, <a href="/contacts">contacts</a> and <ins>announcements</ins>.',
                'Use <code>team-cli</code> for routine tasks. <em>Read the documentation first.</em>',
            ),
        );
        expect(contents(output)).toEqual([html]);
        // The description stands between the title and the row of buttons.
        expect(output.indexOf(title)).toBeLessThan(output.indexOf(html));
        expect(output.indexOf(html)).toBeLessThan(
            output.indexOf('<p class="g-md-button-plugin-row">'),
        );
    });

    it.each(structureExamples)(
        'should render $id with image $image, title $title, description $content and $buttons buttons',
        (item) => {
            expect(contents(preset.render(structureMarkup(item)))).toEqual(
                item.content ? [content(description)] : [],
            );
        },
    );

    it.each(mixedExamples)(
        'should render $id with image $image, title $title, description $content and $buttons buttons in the header with every attribute',
        (item) => {
            expect(contents(preset.render(mixedMarkup(item)))).toEqual(
                item.content ? [content(description, 3)] : [],
            );
        },
    );

    it.each([
        [
            'defaults-003',
            'the minimal description',
            example('', exampleContent),
            header(content(description)),
        ],
        [
            'defaults-008',
            'no empty title and no empty description',
            example('', '::header-title[]', ':::header-content\n:::'),
            header('').replace('</div>', '\n</div>'),
        ],
    ])('should render %s, %s', (_id, _name, markup, html) => {
        expect(preset.render(markup)).toBe(html);
    });

    // Dropping blocks by their place or number is a separate task: here they render as written.
    it.each([
        [
            'boundaries-003',
            'a description outside a header',
            ':::header-content\nDescription.\n:::',
            content(paragraphs('Description.')),
        ],
        [
            'no id',
            'a second description',
            example('', exampleContent, contentMarkup(['Second.'], 1)),
            header(content(description) + content(paragraphs('Second.'), 1)),
        ],
    ])('should render %s, %s, as written', (_id, _name, markup, html) => {
        expect(preset.render(markup)).toBe(html);
    });

    it('should render the description between the other blocks of a header in the source order', () => {
        const output = preset.render(
            example('', exampleButtons[0], exampleContent, exampleTitle, 'Text'),
        );
        expect(output).toBe(
            header(
                `<p class="g-md-button-plugin-row"><a class="g-md-button-plugin g-md-button-plugin_view_action g-md-button-plugin_color_blue" href="/page" data-view="action" data-color="blue">Button 1</a></p>\n${content(description)}${title}<p>Text</p>\n`,
            ),
        );
    });
});
