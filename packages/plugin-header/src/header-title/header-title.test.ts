import MarkdownIt from 'markdown-it';
import {describe, expect, it} from 'vitest';

import {headerPlugin} from '../directive';

import {
    headerTitle,
    headerTitleAttrs,
    headerTitleColors,
    headerTitleFromAttrs,
    headerTitlePlugin,
    headerTitleSizes,
    headerTitleValues,
} from './index';

const md = new MarkdownIt({html: true}).use(headerTitlePlugin);
const withHeader = new MarkdownIt().use(headerPlugin).use(headerTitlePlugin);

const exampleTitle = '::header-title[Team portal]';
const example = (...blocks: string[]) => [':::header', ...blocks, ':::'].join('\n\n');
const header = (content: string) =>
    `<div class="g-md-header-plugin g-md-header-plugin_height_s g-md-header-plugin_width_m" data-height="s" data-width="m">\n${content}</div>\n`;

const title = (size: number | string = 2, color = 'auto', text = 'Team portal') =>
    `<div class="g-md-header-title-plugin g-md-header-title-plugin_size_${size}${color === 'auto' ? '' : ` g-md-header-title-plugin_color_${color}`}"${String(size) === '2' ? '' : ` data-size="${size}"`}${color === 'auto' ? '' : ` data-color="${color}"`}>${text}</div>\n`;
const titles = (output: string) =>
    output.match(/<div class="g-md-header-title-plugin[^>]*>[^<]*<\/div>\n/g) ?? [];

const titleExamples = (['omitted', ...headerTitleSizes] as const)
    .flatMap((size) =>
        (['omitted', ...headerTitleColors] as const).map((color) => ({
            size,
            color,
            attrs: [
                size === 'omitted' ? '' : `size="${size}"`,
                color === 'omitted' ? '' : `color="${color}"`,
            ]
                .filter(Boolean)
                .join(' '),
            html: title(size === 'omitted' ? 2 : size, color === 'omitted' ? 'auto' : color),
        })),
    )
    .map((item, index) => ({id: `title-${String(index + 1).padStart(3, '0')}`, ...item}));

describe('Header title Markdown', () => {
    it.each([
        [
            1,
            '<div class="g-md-header-title-plugin g-md-header-title-plugin_size_1" data-size="1">Title</div>\n',
        ],
        [2, '<div class="g-md-header-title-plugin g-md-header-title-plugin_size_2">Title</div>\n'],
        [
            3,
            '<div class="g-md-header-title-plugin g-md-header-title-plugin_size_3" data-size="3">Title</div>\n',
        ],
        [
            4,
            '<div class="g-md-header-title-plugin g-md-header-title-plugin_size_4" data-size="4">Title</div>\n',
        ],
        [
            5,
            '<div class="g-md-header-title-plugin g-md-header-title-plugin_size_5" data-size="5">Title</div>\n',
        ],
        [
            6,
            '<div class="g-md-header-title-plugin g-md-header-title-plugin_size_6" data-size="6">Title</div>\n',
        ],
    ])('should render size %s as a heading of that level', (size, html) => {
        expect(md.render(`::header-title[Title]{size="${size}"}`)).toBe(html);
    });

    it.each([
        [
            'auto',
            '<div class="g-md-header-title-plugin g-md-header-title-plugin_size_2">Title</div>\n',
        ],
        [
            'gray',
            '<div class="g-md-header-title-plugin g-md-header-title-plugin_size_2 g-md-header-title-plugin_color_gray" data-color="gray">Title</div>\n',
        ],
        [
            'yellow',
            '<div class="g-md-header-title-plugin g-md-header-title-plugin_size_2 g-md-header-title-plugin_color_yellow" data-color="yellow">Title</div>\n',
        ],
        [
            'orange',
            '<div class="g-md-header-title-plugin g-md-header-title-plugin_size_2 g-md-header-title-plugin_color_orange" data-color="orange">Title</div>\n',
        ],
        [
            'red',
            '<div class="g-md-header-title-plugin g-md-header-title-plugin_size_2 g-md-header-title-plugin_color_red" data-color="red">Title</div>\n',
        ],
        [
            'green',
            '<div class="g-md-header-title-plugin g-md-header-title-plugin_size_2 g-md-header-title-plugin_color_green" data-color="green">Title</div>\n',
        ],
        [
            'blue',
            '<div class="g-md-header-title-plugin g-md-header-title-plugin_size_2 g-md-header-title-plugin_color_blue" data-color="blue">Title</div>\n',
        ],
        [
            'violet',
            '<div class="g-md-header-title-plugin g-md-header-title-plugin_size_2 g-md-header-title-plugin_color_violet" data-color="violet">Title</div>\n',
        ],
    ])('should render the %s color', (color, html) => {
        expect(md.render(`::header-title[Title]{color="${color}"}`)).toBe(html);
    });

    it.each([
        ['::header-title[Team portal]', title()],
        ['::header-title[Team portal]{}', title()],
        ['::header-title[Team portal]{size="2" color="auto"}', title()],
        ['::header-title[Team portal]{size=3 color=red}', title(3, 'red')],
        ["::header-title[Team portal]{size='4' color='blue'}", title(4, 'blue')],
        ['::header-title[Team portal]{color="green" size="5"}', title(5, 'green')],
        ['  ::header-title[Team portal]{size="6"}', title(6)],
    ])('should apply independent defaults and read the attributes of %j', (markup, html) => {
        expect(md.render(markup)).toBe(html);
    });

    it.each([
        '::header-title[Team portal]{unknown="value"}',
        '::header-title[Team portal]{.custom #id}',
        '::header-title[Team portal]{onclick="alert(1)" style="color:red" class="x"}',
        '::header-title[Team portal]{level="1" view="action" href="/page"}',
    ])('should skip an unsupported attribute in %j', (markup) => {
        expect(md.render(markup)).toBe(title());
    });

    it.each([
        ['::header-title[Team portal]{size="0"}', title()],
        ['::header-title[Team portal]{size="7"}', title()],
        ['::header-title[Team portal]{size="1.0"}', title()],
        ['::header-title[Team portal]{size="01"}', title()],
        ['::header-title[Team portal]{size=" 1"}', title()],
        ['::header-title[Team portal]{size="h1"}', title()],
        ['::header-title[Team portal]{size="l"}', title()],
        ['::header-title[Team portal]{size=""}', title()],
        ['::header-title[Team portal]{size="1" size="3"}', title()],
        ['::header-title[Team portal]{size="7" color="red"}', title(2, 'red')],
        ['::header-title[Team portal]{color="pink"}', title()],
        ['::header-title[Team portal]{color="black"}', title()],
        ['::header-title[Team portal]{color="standard"}', title()],
        ['::header-title[Team portal]{color="RED"}', title()],
        ['::header-title[Team portal]{color="#f00"}', title()],
        ['::header-title[Team portal]{color=""}', title()],
        ['::header-title[Team portal]{color="red" color="blue"}', title()],
        ['::header-title[Team portal]{size="3" color="<script>alert(1)</script>"}', title(3)],
    ])('should use the default for an unsupported value in %j', (markup, html) => {
        expect(md.render(markup)).toBe(html);
    });

    it.each([
        ['**bold** *italic* `code`', '**bold** *italic* `code`'],
        ['[link](/page) ![image](/a.png)', '[link](/page) ![image](/a.png)'],
        ['# Heading', '# Heading'],
        [':button[Open]{href="/page"}', ':button[Open]{href=&quot;/page&quot;}'],
        [
            '<b>bold</b> <script>alert(1)</script>',
            '&lt;b&gt;bold&lt;/b&gt; &lt;script&gt;alert(1)&lt;/script&gt;',
        ],
        ['Q&A &amp; &copy; &#10;', 'Q&amp;A &amp;amp; &amp;copy; &amp;#10;'],
        ['a [nested] pair', 'a [nested] pair'],
        ['a \\] bracket and a \\\\ backslash', 'a ] bracket and a \\ backslash'],
        ['  spaces around  ', 'spaces around'],
        ['Заголовок баннера 🚀', 'Заголовок баннера 🚀'],
        ['"quotes" and \'apostrophes\'', "&quot;quotes&quot; and 'apostrophes'"],
    ])('should render the text %j as plain text', (text, html) => {
        expect(md.render(`::header-title[${text}]{size="1"}`)).toBe(title(1, 'auto', html));
    });

    it.each(['::header-title[]', '::header-title[ ]', '::header-title[]{size="1" color="red"}'])(
        'should render nothing for the empty title %j',
        (markup) => {
            expect(md.render(markup)).toBe('');
            const tokens = md.parse(markup, {});
            expect(tokens.map((token) => [token.type, token.content])).toEqual([
                ['header-title', ''],
            ]);
        },
    );

    it.each([
        '::header-title',
        '::header-title{size="1"}',
        '::header-title[Title](/page)',
        ':header-title[Title]',
        ':::header-title\nTitle\n:::',
        '::header-titles[Title]',
        '    ::header-title[Title]',
        'Text\n::header-title[Title]',
    ])('should leave unsupported syntax as Markdown in %j', (markup) => {
        expect(md.parse(markup, {}).some((token) => token.type === 'header-title')).toBe(false);
        expect(md.render(markup)).not.toContain('g-md-header-title-plugin');
    });

    it('should parse the title as one block token with the text as its content', () => {
        const tokens = md.parse(
            'Before\n\n::header-title[Team **portal**]{size="3" color="red"}',
            {},
        );
        expect(tokens.map((token) => token.type)).toEqual([
            'paragraph_open',
            'inline',
            'paragraph_close',
            'header-title',
        ]);
        const token = tokens[3];
        expect(token.tag).toBe('div');
        expect(token.block).toBe(true);
        expect(token.nesting).toBe(0);
        expect(token.map).toEqual([2, 3]);
        expect(token.markup).toBe('::header-title');
        expect(token.content).toBe('Team **portal**');
        expect(token.children).toBeNull();
        expect(token.attrGet('data-size')).toBe('3');
        expect(token.attrGet('data-color')).toBe('red');
    });

    it.each([
        [
            'after a paragraph',
            'Before\n\n::header-title[Title]\n\nAfter',
            `<p>Before</p>\n${title(2, 'auto', 'Title')}<p>After</p>\n`,
        ],
        [
            'before a paragraph without an empty line',
            '::header-title[Title]\nAfter',
            `${title(2, 'auto', 'Title')}<p>After</p>\n`,
        ],
        [
            'in a list item',
            '- ::header-title[Title]',
            `<ul>\n<li>\n${title(2, 'auto', 'Title')}</li>\n</ul>\n`,
        ],
        [
            'in a quote',
            '> ::header-title[Title]',
            `<blockquote>\n${title(2, 'auto', 'Title')}</blockquote>\n`,
        ],
        [
            'two titles in a row',
            '::header-title[First]\n::header-title[Second]{size="1"}',
            title(2, 'auto', 'First') + title(1, 'auto', 'Second'),
        ],
    ])('should render the title %s', (_name, markup, html) => {
        expect(md.render(markup)).toBe(html);
    });

    it('should render once when the plugin is used several times', () => {
        const twice = new MarkdownIt().use(headerTitlePlugin).use(headerTitlePlugin);
        expect(twice.render(exampleTitle)).toBe(title());
    });
});

describe('Header title options', () => {
    it.each([
        [{}, {size: 2, color: 'auto'}, {}],
        [{size: '1'}, {size: 1, color: 'auto'}, {size: '1'}],
        [{size: 6}, {size: 6, color: 'auto'}, {size: '6'}],
        [{size: '2', color: 'auto'}, {size: 2, color: 'auto'}, {}],
        [{color: 'violet'}, {size: 2, color: 'violet'}, {color: 'violet'}],
        [
            {size: '4', color: 'orange'},
            {size: 4, color: 'orange'},
            {size: '4', color: 'orange'},
        ],
        [{size: 0, color: 'black'}, {size: 2, color: 'auto'}, {}],
        [{size: 1.5, color: 1}, {size: 2, color: 'auto'}, {}],
        [{size: ['1', '2'], color: ['red']}, {size: 2, color: 'auto'}, {}],
        [{size: null, color: undefined}, {size: 2, color: 'auto'}, {}],
    ])('should resolve the options of %j', (attrs, options, values) => {
        expect(headerTitle(attrs)).toEqual(options);
        expect(headerTitleValues(headerTitle(attrs))).toEqual(values);
    });

    it.each(headerTitleSizes.flatMap((size) => headerTitleColors.map((color) => ({size, color}))))(
        'should read size $size and color $color back from the rendered attributes',
        (options) => {
            const attrs = headerTitleAttrs(options);
            expect(headerTitleFromAttrs((name) => attrs[name])).toEqual(options);
        },
    );

    it('should read the defaults from an element without the attributes', () => {
        expect(headerTitleFromAttrs(() => null)).toEqual({size: 2, color: 'auto'});
    });

    it.each([
        [
            {},
            {
                class: 'g-md-header-title-plugin g-md-header-title-plugin_size_2',
            },
        ],
        [
            {size: 1, color: 'red'},
            {
                class: 'g-md-header-title-plugin g-md-header-title-plugin_size_1 g-md-header-title-plugin_color_red',
                'data-size': '1',
                'data-color': 'red',
            },
        ],
        [
            {size: '9', color: 'pink'},
            {
                class: 'g-md-header-title-plugin g-md-header-title-plugin_size_2',
            },
        ],
    ])('should build the attributes of %j', (options, attrs) => {
        expect(headerTitleAttrs(options)).toEqual(attrs);
    });
});

describe('Header title in a header', () => {
    it.each(titleExamples)(
        'should render $id with size $size and color $color',
        ({attrs, html}) => {
            const markup = example(`${exampleTitle}${attrs && `{${attrs}}`}`);
            expect(withHeader.render(markup)).toBe(header(html));
        },
    );

    it('should render no empty title in a header', () => {
        expect(titles(withHeader.render(example('::header-title[]')))).toEqual([]);
    });

    it.each([
        ['a title outside a header', '::header-title[Heading]', title(2, 'auto', 'Heading')],
        [
            'the title after the other blocks of a header',
            example('Text', exampleTitle),
            header(`<p>Text</p>\n${title()}`),
        ],
    ])('should render %s as written', (_name, markup, html) => {
        expect(withHeader.render(markup)).toBe(html);
    });

    it.each([
        ['', ''],
        [' after other blocks', 'Text'],
    ])('should render a second title%s as a paragraph', (_name, text) => {
        const markup = example(
            '::header-title[First]',
            ...(text ? [text] : []),
            '::header-title[Second]',
        );
        const between = text ? `<p>${text}</p>\n` : '';
        expect(withHeader.render(markup)).toBe(
            header(`${title(2, 'auto', 'First')}${between}<p>::header-title[Second]</p>\n`),
        );
    });

    it('should render one title in each of two headers', () => {
        const markup = `${example(exampleTitle)}\n\n${example(exampleTitle)}`;
        expect(titles(withHeader.render(markup))).toEqual([title(), title()]);
    });
});
