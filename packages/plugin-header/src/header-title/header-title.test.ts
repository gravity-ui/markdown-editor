import MarkdownIt from 'markdown-it';
import {describe, expect, it} from 'vitest';

import {
    example,
    exampleButtons,
    exampleId,
    exampleTitle,
    header,
    mixedExamples,
    mixedMarkup,
    structureExamples,
    structureMarkup,
} from '../../tests/examples';
import {headerPreset} from '../preset';

import {
    headerSanitizeAllowedAttributes,
    headerTitle,
    headerTitleAttrs,
    headerTitleColors,
    headerTitleFromAttrs,
    headerTitlePlugin,
    headerTitleSizes,
    headerTitleValues,
} from './index';

const md = new MarkdownIt({html: true}).use(headerTitlePlugin);
const preset = new MarkdownIt().use(headerPreset);

/** The title with the given size and color; the defaults render no data attribute. */
const title = (size: number | string = 2, color = 'auto', text = 'Team portal') =>
    `<div class="g-md-header-title-plugin g-md-header-title-plugin_size_${size}${color === 'auto' ? '' : ` g-md-header-title-plugin_color_${color}`}" role="heading" aria-level="${size}"${String(size) === '2' ? '' : ` data-size="${size}"`}${color === 'auto' ? '' : ` data-color="${color}"`}>${text}</div>\n`;
/** The titles of a rendered document. */
const titles = (output: string) =>
    output.match(/<div class="g-md-header-title-plugin[^>]*>[^<]*<\/div>\n/g) ?? [];

// title-001 … title-063: no size and every size, each without a color and with every color.
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
    .map((item, index) => ({id: exampleId('title', index), ...item}));

describe('Header title Markdown', () => {
    it.each([
        [
            1,
            '<div class="g-md-header-title-plugin g-md-header-title-plugin_size_1" role="heading" aria-level="1" data-size="1">Title</div>\n',
        ],
        [
            2,
            '<div class="g-md-header-title-plugin g-md-header-title-plugin_size_2" role="heading" aria-level="2">Title</div>\n',
        ],
        [
            3,
            '<div class="g-md-header-title-plugin g-md-header-title-plugin_size_3" role="heading" aria-level="3" data-size="3">Title</div>\n',
        ],
        [
            4,
            '<div class="g-md-header-title-plugin g-md-header-title-plugin_size_4" role="heading" aria-level="4" data-size="4">Title</div>\n',
        ],
        [
            5,
            '<div class="g-md-header-title-plugin g-md-header-title-plugin_size_5" role="heading" aria-level="5" data-size="5">Title</div>\n',
        ],
        [
            6,
            '<div class="g-md-header-title-plugin g-md-header-title-plugin_size_6" role="heading" aria-level="6" data-size="6">Title</div>\n',
        ],
    ])('should render size %s as a heading of that level', (size, html) => {
        expect(md.render(`::header-title[Title]{size="${size}"}`)).toBe(html);
    });

    it.each([
        [
            'auto',
            '<div class="g-md-header-title-plugin g-md-header-title-plugin_size_2" role="heading" aria-level="2">Title</div>\n',
        ],
        [
            'gray',
            '<div class="g-md-header-title-plugin g-md-header-title-plugin_size_2 g-md-header-title-plugin_color_gray" role="heading" aria-level="2" data-color="gray">Title</div>\n',
        ],
        [
            'yellow',
            '<div class="g-md-header-title-plugin g-md-header-title-plugin_size_2 g-md-header-title-plugin_color_yellow" role="heading" aria-level="2" data-color="yellow">Title</div>\n',
        ],
        [
            'orange',
            '<div class="g-md-header-title-plugin g-md-header-title-plugin_size_2 g-md-header-title-plugin_color_orange" role="heading" aria-level="2" data-color="orange">Title</div>\n',
        ],
        [
            'red',
            '<div class="g-md-header-title-plugin g-md-header-title-plugin_size_2 g-md-header-title-plugin_color_red" role="heading" aria-level="2" data-color="red">Title</div>\n',
        ],
        [
            'green',
            '<div class="g-md-header-title-plugin g-md-header-title-plugin_size_2 g-md-header-title-plugin_color_green" role="heading" aria-level="2" data-color="green">Title</div>\n',
        ],
        [
            'blue',
            '<div class="g-md-header-title-plugin g-md-header-title-plugin_size_2 g-md-header-title-plugin_color_blue" role="heading" aria-level="2" data-color="blue">Title</div>\n',
        ],
        [
            'violet',
            '<div class="g-md-header-title-plugin g-md-header-title-plugin_size_2 g-md-header-title-plugin_color_violet" role="heading" aria-level="2" data-color="violet">Title</div>\n',
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

    // The text is plain: nothing in it is parsed, and the renderer escapes it for HTML.
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
            // The token stays for a parser of the token stream.
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
        expect(token.attrGet('aria-level')).toBe('3');
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

    it('should list the level of the title for the sanitizer', () => {
        expect(headerSanitizeAllowedAttributes).toEqual({div: ['aria-level']});
    });

    it('should read the defaults from an element without the attributes', () => {
        expect(headerTitleFromAttrs(() => null)).toEqual({size: 2, color: 'auto'});
    });

    it('should read the size from the data attribute, not from the level', () => {
        const attrs: Record<string, string> = {'aria-level': '5', 'data-size': '3'};
        expect(headerTitleFromAttrs((name) => attrs[name])).toEqual({size: 3, color: 'auto'});
        expect(headerTitleFromAttrs((name) => (name === 'aria-level' ? '5' : null))).toEqual({
            size: 2,
            color: 'auto',
        });
    });

    it.each([
        [
            {},
            {
                class: 'g-md-header-title-plugin g-md-header-title-plugin_size_2',
                role: 'heading',
                'aria-level': '2',
            },
        ],
        [
            {size: 1, color: 'red'},
            {
                class: 'g-md-header-title-plugin g-md-header-title-plugin_size_1 g-md-header-title-plugin_color_red',
                role: 'heading',
                'aria-level': '1',
                'data-size': '1',
                'data-color': 'red',
            },
        ],
        [
            {size: '9', color: 'pink'},
            {
                class: 'g-md-header-title-plugin g-md-header-title-plugin_size_2',
                role: 'heading',
                'aria-level': '2',
            },
        ],
    ])('should build the attributes of %j', (options, attrs) => {
        expect(headerTitleAttrs(options)).toEqual(attrs);
    });
});

describe('Header title syntax examples', () => {
    it.each(titleExamples)(
        'should render $id with size $size and color $color',
        ({attrs, html}) => {
            const markup = example('', `${exampleTitle}${attrs && `{${attrs}}`}`);
            expect(preset.render(markup)).toBe(header(html));
        },
    );

    it.each(structureExamples)(
        'should render $id with image $image, title $title, description $content and $buttons buttons',
        (item) => {
            expect(titles(preset.render(structureMarkup(item)))).toEqual(
                item.title ? [title()] : [],
            );
        },
    );

    it.each(mixedExamples)(
        'should render $id with image $image, title $title, description $content and $buttons buttons in the header with every attribute',
        (item) => {
            expect(titles(preset.render(mixedMarkup(item)))).toEqual(
                item.title ? [title(1, 'yellow')] : [],
            );
        },
    );

    it.each([
        ['defaults-002', 'the minimal title', example('', exampleTitle), [title()]],
        [
            'defaults-007',
            'the title in a header with explicit defaults',
            example('height="s" width="m" align="left" vertical="center"', exampleTitle),
            [title()],
        ],
        [
            'defaults-008',
            'no empty title',
            example('', '::header-title[]', ':::header-content\n:::'),
            [],
        ],
        [
            'boundaries-007',
            'the title in a header with an unknown attribute',
            example('unknown="value"', exampleTitle),
            [title()],
        ],
        [
            'boundaries-008',
            'the title in a header with an invalid height',
            example('height="huge"', exampleTitle),
            [title()],
        ],
        [
            'boundaries-014',
            'the title in a header with the theme and the blur without an image',
            example('bg-image-theme="dark" bg-image-blur="true"', exampleTitle),
            [title()],
        ],
    ])('should render %s, %s', (_id, _name, markup, html) => {
        expect(titles(preset.render(markup))).toEqual(html);
    });

    // Dropping blocks by their place or number is a separate task: here they render as written.
    it.each([
        [
            'boundaries-002',
            'a title outside a header',
            '::header-title[Heading]',
            title(2, 'auto', 'Heading'),
        ],
        [
            'boundaries-006',
            'a second title',
            example('', '::header-title[First]', '::header-title[Second]'),
            header(title(2, 'auto', 'First') + title(2, 'auto', 'Second')),
        ],
    ])('should render %s, %s, as written', (_id, _name, markup, html) => {
        expect(preset.render(markup)).toBe(html);
    });

    it('should render the title between the other blocks of a header in the source order', () => {
        const output = preset.render(
            example('', exampleButtons[0], exampleTitle, 'Text', '::header-title[Last]{size="6"}'),
        );
        expect(output).toBe(
            header(
                `<p class="g-md-button-plugin-row"><a class="g-md-button-plugin g-md-button-plugin_view_action g-md-button-plugin_color_blue" href="/page" data-view="action" data-color="blue">Button 1</a></p>\n${title()}<p>Text</p>\n${title(6, 'auto', 'Last')}`,
            ),
        );
    });
});
