import MarkdownIt from 'markdown-it';
import {describe, expect, it} from 'vitest';

import {
    defaultHeaderTag,
    example,
    exampleButtons,
    exampleContent,
    exampleId,
    exampleImageUrl,
    exampleTitle,
    mixedAlign,
    mixedExamples,
    mixedMarkup,
    structureExamples,
    structureMarkup,
} from '../../tests/examples';
import {
    headerAligns,
    headerAttrs,
    headerBackgroundFromAttrs,
    headerBgColorFamilies,
    headerBgColorSaturations,
    headerBgColors,
    headerDimensionsFromAttrs,
    headerHeights,
    headerLayout,
    headerLayoutFromAttrs,
    headerLayoutValues,
    headerPlugin,
    headerVerticals,
    headerWidths,
    safeImageUrl,
    toCssUrl,
} from '../index';
import {headerPreset} from '../preset';

const md = new MarkdownIt().use(headerPlugin);

const html = (height: string, width: string) =>
    `<div class="g-md-header-plugin g-md-header-plugin_height_${height} g-md-header-plugin_width_${width}" data-height="${height}" data-width="${width}"></div>\n`;

describe('Header Markdown', () => {
    it.each(headerHeights.flatMap((height) => headerWidths.map((width) => ({height, width}))))(
        'should render height $height and width $width',
        ({height, width}) => {
            const markup = `:::header{height="${height}" width="${width}"}\n:::`;
            expect(md.render(markup)).toBe(html(height, width));
        },
    );

    it.each([
        [':::header\n:::', 's', 'm'],
        [':::header{width=full}\n:::', 's', 'full'],
        [":::header{height='l'}\n:::", 'l', 'm'],
    ])('should apply independent defaults for %j', (markup, height, width) => {
        expect(md.render(markup)).toBe(html(height, width));
    });

    it.each([
        ':::header{color="red"}\n:::',
        ':::header{.custom #id}\n:::',
        ':::header{onclick="alert(1)"}\n:::',
    ])('should skip an unsupported attribute in %j', (markup) => {
        expect(md.render(markup)).toBe(html('s', 'm'));
    });

    it.each([
        [':::header{height="xl" color="red"}\n:::', 's', 'm'],
        [':::header{height="m" width="100%"}\n:::', 'm', 'm'],
        [':::header{width="full" width="s"}\n:::', 's', 'm'],
        [':::header{height="<script>alert(1)</script>"}\n:::', 's', 'm'],
    ])('should use the default for an unsupported value in %j', (markup, height, width) => {
        expect(md.render(markup)).toBe(html(height, width));
    });

    it('should parse child blocks in the container token stream', () => {
        const markup = ':::header\nText **with formatting**\n:::';
        const tokens = md.parse(markup, {});
        expect(tokens.map((token) => token.type)).toEqual([
            'header_open',
            'paragraph_open',
            'inline',
            'paragraph_close',
            'header_close',
        ]);
        expect(tokens[0].attrGet('data-height')).toBe('s');
        expect(tokens[0].attrGet('data-width')).toBe('m');
        expect(md.render(markup)).toContain('<p>Text <strong>with formatting</strong></p>');
    });

    it.each([':::header[Title]{width="s"}\n:::', ':::header(link)\n:::', ':::header Title\n:::'])(
        'should leave unsupported opening syntax as Markdown in %j',
        (markup) => {
            expect(md.parse(markup, {}).some((token) => token.type === 'header_open')).toBe(false);
        },
    );

    it('should preserve nested containers and paragraphs after them', () => {
        const tokens = md.parse(':::header\n:::header\nInner\n:::\nOuter\n:::', {});
        expect(tokens.filter((token) => token.type === 'header_open')).toHaveLength(2);
        expect(tokens.filter((token) => token.type === 'header_close')).toHaveLength(2);
        expect(tokens[tokens.length - 1].type).toBe('header_close');
        expect(
            tokens.filter((token) => token.type === 'inline').map((token) => token.content),
        ).toEqual(['Inner', 'Outer']);
    });

    const expectContainer = (markup: string, contents: string[]) => {
        const tokens = md.parse(markup, {});
        expect(tokens[0].type).toBe('header_open');
        expect(tokens[tokens.length - 1].type).toBe('header_close');
        expect(
            tokens.filter((token) => token.type === 'inline').map((token) => token.content),
        ).toEqual(contents);
    };

    it.each([
        [':::header\n- a\n- b\n:::', ['a', 'b']],
        [':::header\n1. a\n2. b\n:::', ['a', 'b']],
        [':::header\n- a\n  - b\n:::', ['a', 'b']],
        [':::header\n> a\n:::', ['a']],
        [':::header\n:::header\n- a\n:::\n- b\n:::', ['a', 'b']],
        [':::header\n| a |\n| - |\n| b |\n:::', ['a', 'b']],
    ])('should close the container right after a child block in %j', expectContainer);

    it.each([':::header\nUnclosed', '    :::header\n    :::'])(
        'should leave incomplete or indented directives as Markdown in %j',
        (markup) => {
            expect(md.parse(markup, {}).some((token) => token.type === 'header_open')).toBe(false);
        },
    );

    it('should preserve an incomplete directive inside a paragraph', () => {
        const markup = 'Before\n:::header\nUnclosed';
        expect(md.render(markup)).toBe(new MarkdownIt().render(markup));
    });

    it('should resolve references from child blocks in the document environment', () => {
        const markup = ':::header\n[inside][ref]\n:::\n\n[ref]: https://example.com';
        expect(md.render(markup)).toContain('<a href="https://example.com">inside</a>');
    });

    it('should assign independent default dimensions to an empty block', () => {
        const [token] = md.parse(':::header{height="s"}\n:::', {});
        expect(token.attrGet('data-height')).toBe('s');
        expect(token.attrGet('data-width')).toBe('m');
    });
});

describe('Header background', () => {
    const block = (modifiers: string, attrs: string) =>
        `<div class="g-md-header-plugin g-md-header-plugin_height_s g-md-header-plugin_width_m${modifiers}" data-height="s" data-width="m"${attrs}></div>\n`;
    // Built at runtime for the `no-script-url` lint rule.
    const scriptUrl = ['javascript', 'alert(1)'].join(':');

    it.each(headerBgColors)('should render the %s color', (color) => {
        expect(md.render(`:::header{bg-color="${color}"}\n:::`)).toBe(
            block(` g-md-header-plugin_bg-color_${color}`, ` data-bg-color="${color}"`),
        );
    });

    it('should render an image in the style attribute', () => {
        expect(md.render(':::header{bg-image="./.files/a (1).jpg"}\n:::')).toBe(
            block(
                ' g-md-header-plugin_bg-image',
                ' data-bg-image="./.files/a (1).jpg" style="background-image:url(&quot;./.files/a%20%281%29.jpg&quot;)"',
            ),
        );
    });

    it('should apply the theme and blur with an image', () => {
        const markup =
            ':::header{bg-color="gray-light" bg-image="https://example.com/a.png" bg-image-theme="dark" bg-image-blur="true"}\n:::';
        expect(md.render(markup)).toBe(
            block(
                ' g-md-header-plugin_bg-color_gray-light g-md-header-plugin_bg-image g-md-header-plugin_bg-image-blur g-root g-root_theme_dark',
                ' data-bg-color="gray-light" data-bg-image="https://example.com/a.png" data-bg-image-theme="dark" data-bg-image-blur="true" style="background-image:url(&quot;https://example.com/a.png&quot;)"',
            ),
        );
    });

    it('should drop the theme and blur without an image', () => {
        expect(md.render(':::header{bg-image-theme="light" bg-image-blur="true"}\n:::')).toBe(
            html('s', 'm'),
        );
    });

    it.each([
        ':::header{bg-color="pink"}\n:::',
        ':::header{bg-color="blue"}\n:::',
        ':::header{bg-color="blue-light" bg-color="red-light"}\n:::',
        ':::header{bg-image=""}\n:::',
        ':::header{bg-image-theme="system"}\n:::',
        ':::header{bg-image-theme="sepia"}\n:::',
        ':::header{bg-image-blur="false"}\n:::',
        ':::header{bg-image-blur="yes"}\n:::',
    ])('should use the default for an unsupported or default value in %j', (markup) => {
        expect(md.render(markup)).toBe(html('s', 'm'));
    });

    it.each([
        scriptUrl,
        scriptUrl.toUpperCase(),
        ` ${scriptUrl}`,
        'vbscript:msgbox(1)',
        'data:text/html,<script>alert(1)</script>',
        'data:image/svg+xml,<svg/>',
        'file:///etc/passwd',
    ])('should reject the image address %j', (url) => {
        expect(safeImageUrl(url)).toBeNull();
        expect(toCssUrl(url)).toBeNull();
        expect(md.render(`:::header{bg-image="${url}" bg-image-theme="dark"}\n:::`)).toBe(
            html('s', 'm'),
        );
    });

    it.each(['java\tscript:alert(1)', 'https://example.com/\u0000.png', 'a\u007f.png'])(
        'should reject control characters in %j',
        (url) => {
            expect(safeImageUrl(url)).toBeNull();
        },
    );

    it.each([
        ['https://example.com/a.png', 'https://example.com/a.png'],
        ['HTTP://example.com/a.png', 'HTTP://example.com/a.png'],
        ['//example.com/a.png', '//example.com/a.png'],
        ['blob:https://example.com/0f8c', 'blob:https://example.com/0f8c'],
        ['  ./.files/a.png  ', './.files/a.png'],
        ['a.png?size=1:2', 'a.png?size=1:2'],
    ])('should accept the image address %j', (url, expected) => {
        expect(safeImageUrl(url)).toBe(expected);
    });

    it('should encode quotes, brackets, and comments in the CSS address', () => {
        const url = `a.png") ;background:url(${scriptUrl}) /*'\\`;
        expect(toCssUrl(url)).toBe(
            'url("a.png%22%29%20;background:url%28javascript:alert%281%29%29%20/%2A%27%5C")',
        );
    });

    it('should escape quotes of the image address in HTML', () => {
        const output = md.render(':::header{bg-image="a\\".png"}\n:::');
        expect(output).toContain('data-bg-image="a&quot;.png"');
        expect(output).toContain('style="background-image:url(&quot;a%22.png&quot;)"');
    });
});

describe('Header alignment', () => {
    const block = (modifiers: string, attrs: string) =>
        `<div class="g-md-header-plugin g-md-header-plugin_height_s g-md-header-plugin_width_m${modifiers}" data-height="s" data-width="m"${attrs}></div>\n`;

    it.each([
        ['left', '', ''],
        ['center', ' g-md-header-plugin_align_center', ' data-align="center"'],
        ['right', ' g-md-header-plugin_align_right', ' data-align="right"'],
    ])('should render the %s alignment', (align, modifiers, attrs) => {
        expect(md.render(`:::header{align="${align}"}\n:::`)).toBe(block(modifiers, attrs));
    });

    it.each([
        ['top', ' g-md-header-plugin_vertical_top', ' data-vertical="top"'],
        ['center', '', ''],
        ['bottom', ' g-md-header-plugin_vertical_bottom', ' data-vertical="bottom"'],
    ])('should render the %s vertical alignment', (vertical, modifiers, attrs) => {
        expect(md.render(`:::header{vertical="${vertical}"}\n:::`)).toBe(block(modifiers, attrs));
    });

    it.each([
        ':::header{align="justify"}\n:::',
        ':::header{align="LEFT"}\n:::',
        ':::header{align=""}\n:::',
        ':::header{align="center" align="right"}\n:::',
        ':::header{vertical="middle"}\n:::',
        ':::header{vertical="left"}\n:::',
        ':::header{vertical="top" vertical="bottom"}\n:::',
        ':::header{valign="top" text-align="center"}\n:::',
    ])('should use the default alignment for %j', (markup) => {
        expect(md.render(markup)).toBe(html('s', 'm'));
    });

    it('should render the alignment between the dimensions and the background', () => {
        expect(
            md.render(
                ':::header{bg-color="red-light" vertical="bottom" align="right" width="s" height="l"}\n:::',
            ),
        ).toBe(
            '<div class="g-md-header-plugin g-md-header-plugin_height_l g-md-header-plugin_width_s g-md-header-plugin_align_right g-md-header-plugin_vertical_bottom g-md-header-plugin_bg-color_red-light" data-height="l" data-width="s" data-align="right" data-vertical="bottom" data-bg-color="red-light"></div>\n',
        );
    });

    it.each([
        [{}, {align: 'left', vertical: 'center'}, {}],
        [{align: 'center'}, {align: 'center', vertical: 'center'}, {align: 'center'}],
        [{vertical: 'top'}, {align: 'left', vertical: 'top'}, {vertical: 'top'}],
        [
            {align: 'right', vertical: 'bottom'},
            {align: 'right', vertical: 'bottom'},
            {align: 'right', vertical: 'bottom'},
        ],
        [{align: 'middle', vertical: 1}, {align: 'left', vertical: 'center'}, {}],
        [{align: null, vertical: undefined}, {align: 'left', vertical: 'center'}, {}],
    ])('should resolve the layout of %j', (attrs, layout, values) => {
        expect(headerLayout(attrs)).toEqual(layout);
        expect(headerLayoutValues(headerLayout(attrs))).toEqual(values);
    });

    it('should read the options back from the rendered attributes', () => {
        const attrs = headerAttrs({
            height: 'm',
            width: 'full',
            align: 'center',
            vertical: 'top',
            'bg-color': 'blue-heavy',
            'bg-image': '/a.png',
            'bg-image-theme': 'light',
            'bg-image-blur': true,
        });
        const getAttr = (name: string) => attrs[name];
        expect(headerDimensionsFromAttrs(getAttr)).toEqual({height: 'm', width: 'full'});
        expect(headerLayoutFromAttrs(getAttr)).toEqual({align: 'center', vertical: 'top'});
        expect(headerBackgroundFromAttrs(getAttr)).toEqual({
            'bg-color': 'blue-heavy',
            'bg-image': '/a.png',
            'bg-image-theme': 'light',
            'bg-image-blur': true,
        });
    });
});

describe('Header image address', () => {
    const block = (address: string, css: string) =>
        `<div class="g-md-header-plugin g-md-header-plugin_height_s g-md-header-plugin_width_m g-md-header-plugin_bg-image" data-height="s" data-width="m" data-bg-image="${address}" style="background-image:url(&quot;${css}&quot;)"></div>\n`;

    // The address is taken as written; the renderer escapes it for HTML.
    it.each([
        ['/image&copy;.png', '/image&amp;copy;.png', '/image&amp;copy;.png'],
        ['/image&#10;.png', '/image&amp;#10;.png', '/image&amp;#10;.png'],
        ['/a.png?x=1&amp;y=2', '/a.png?x=1&amp;amp;y=2', '/a.png?x=1&amp;amp;y=2'],
        ['/a.png?x=1&y=2&copy=3', '/a.png?x=1&amp;y=2&amp;copy=3', '/a.png?x=1&amp;y=2&amp;copy=3'],
        ['/a&lt;b&gt;.png', '/a&amp;lt;b&amp;gt;.png', '/a&amp;lt;b&amp;gt;.png'],
        ['/a\\"b.png', '/a&quot;b.png', '/a%22b.png'],
        ['/a\\\\b.png', '/a\\b.png', '/a%5Cb.png'],
        ['/a b (1).png', '/a b (1).png', '/a%20b%20%281%29.png'],
    ])('should keep the address %j as written', (address, data, css) => {
        expect(md.render(`:::header{bg-image="${address}"}\n:::`)).toBe(block(data, css));
    });

    it.each([
        [":::header{bg-image='/a&copy;.png'}\n:::", '/a&amp;copy;.png'],
        [':::header{bg-image=image}\n:::', 'image'],
        [':::header{ height="s"  bg-image = "/a&copy;.png" }\n:::', '/a&amp;copy;.png'],
        [
            ':::header{title="bg-image=\\"/wrong.png\\"" bg-image="/a&copy;.png"}\n:::',
            '/a&amp;copy;.png',
        ],
    ])('should read the address of %j as %j', (markup, address) => {
        expect(md.render(markup)).toBe(block(address, address));
    });

    it('should not render an image for a repeated address', () => {
        expect(md.render(':::header{bg-image="/a.png" bg-image="/b.png"}\n:::')).toBe(
            html('s', 'm'),
        );
    });

    it('should not decode an entity into the scheme of the address', () => {
        // Built at runtime for the `no-script-url` lint rule.
        const address = ['&#106;avascript', 'alert(1)'].join(':');
        expect(md.render(`:::header{bg-image="${address}"}\n:::`)).toBe(
            block('&amp;#106;avascript:alert(1)', '&amp;#106;avascript:alert%281%29'),
        );
    });

    it('should keep the address in the token for the editor', () => {
        const [token] = md.parse(':::header{bg-image="/image&copy;.png?a=1&amp;b=2"}\n:::', {});
        expect(token.attrGet('data-bg-image')).toBe('/image&copy;.png?a=1&amp;b=2');
        expect(token.markup).toBe(':::header');
        expect(token.map).toEqual([0, 2]);
    });
});

// The examples of the syntax. The blocks inside a header have their own tests,
// so here only the tag of the header is compared.

const preset = new MarkdownIt().use(headerPreset);
const headerTag = (markup: string) => preset.render(markup).match(/^<div[^>]*>/)?.[0];

// layout-001 … layout-108: every height and width with both alignments.
const layoutExamples = headerHeights
    .flatMap((height) =>
        headerWidths.flatMap((width) =>
            headerAligns.flatMap((align) =>
                headerVerticals.map((vertical) => ({height, width, align, vertical})),
            ),
        ),
    )
    .map((item, index) => ({id: exampleId('layout', index), ...item}));

// The image, its theme and its blur as written in the markup, and as rendered:
// the modifiers, the theme classes and the data attributes after the fill.
const exampleImages = [
    ['off', 'omitted', 'omitted', '', '', '', ''],
    ['on', 'omitted', 'omitted', `bg-image="${exampleImageUrl}"`, '', '', ''],
    ['on', 'omitted', 'true', `bg-image="${exampleImageUrl}" bg-image-blur="true"`, 'blur', '', ''],
    [
        'on',
        'system',
        'omitted',
        `bg-image="${exampleImageUrl}" bg-image-theme="system"`,
        '',
        '',
        '',
    ],
    [
        'on',
        'system',
        'true',
        `bg-image="${exampleImageUrl}" bg-image-theme="system" bg-image-blur="true"`,
        'blur',
        '',
        '',
    ],
    [
        'on',
        'light',
        'omitted',
        `bg-image="${exampleImageUrl}" bg-image-theme="light"`,
        '',
        ' g-root g-root_theme_light',
        ' data-bg-image-theme="light"',
    ],
    [
        'on',
        'light',
        'true',
        `bg-image="${exampleImageUrl}" bg-image-theme="light" bg-image-blur="true"`,
        'blur',
        ' g-root g-root_theme_light',
        ' data-bg-image-theme="light"',
    ],
    [
        'on',
        'dark',
        'omitted',
        `bg-image="${exampleImageUrl}" bg-image-theme="dark"`,
        '',
        ' g-root g-root_theme_dark',
        ' data-bg-image-theme="dark"',
    ],
    [
        'on',
        'dark',
        'true',
        `bg-image="${exampleImageUrl}" bg-image-theme="dark" bg-image-blur="true"`,
        'blur',
        ' g-root g-root_theme_dark',
        ' data-bg-image-theme="dark"',
    ],
] as const;

// background-001 … background-171: no fill and every fill, a family after a family,
// with every state of the image.
const backgroundExamples = [
    'omitted',
    ...headerBgColorFamilies.flatMap((family) =>
        headerBgColorSaturations.map((saturation) => `${family}-${saturation}`),
    ),
]
    .flatMap((fill) =>
        exampleImages.map(([image, theme, blur, markup, blurred, themeClass, themeData]) => {
            const filled = fill !== 'omitted';
            return {
                image,
                fill,
                theme,
                blur,
                attrs: [filled ? `bg-color="${fill}"` : '', markup].filter(Boolean).join(' '),
                modifiers: [
                    filled ? ` g-md-header-plugin_bg-color_${fill}` : '',
                    image === 'on' ? ' g-md-header-plugin_bg-image' : '',
                    blurred ? ' g-md-header-plugin_bg-image-blur' : '',
                    themeClass,
                ].join(''),
                data: [
                    filled ? ` data-bg-color="${fill}"` : '',
                    image === 'on' ? ` data-bg-image="${exampleImageUrl}"` : '',
                    themeData,
                    blurred ? ' data-bg-image-blur="true"' : '',
                    image === 'on'
                        ? ` style="background-image:url(&quot;${exampleImageUrl}&quot;)"`
                        : '',
                ].join(''),
            };
        }),
    )
    .map((item, index) => ({id: exampleId('background', index), ...item}));

const mixedTag = (align: string) =>
    `<div class="g-md-header-plugin g-md-header-plugin_height_l g-md-header-plugin_width_full g-md-header-plugin_align_${align} g-md-header-plugin_vertical_bottom g-md-header-plugin_bg-color_violet-light g-md-header-plugin_bg-image g-md-header-plugin_bg-image-blur g-root g-root_theme_dark" data-height="l" data-width="full" data-align="${align}" data-vertical="bottom" data-bg-color="violet-light" data-bg-image="${exampleImageUrl}" data-bg-image-theme="dark" data-bg-image-blur="true" style="background-image:url(&quot;${exampleImageUrl}&quot;)">`;

describe('Header syntax examples', () => {
    it.each(layoutExamples)(
        'should render $id with height $height, width $width, align $align and vertical $vertical',
        ({height, width, align, vertical}) => {
            const markup = example(
                `height="${height}" width="${width}" align="${align}" vertical="${vertical}"`,
                exampleTitle,
                exampleContent,
                ...exampleButtons,
            );
            const modifiers = [
                align === 'left' ? '' : ` g-md-header-plugin_align_${align}`,
                vertical === 'center' ? '' : ` g-md-header-plugin_vertical_${vertical}`,
            ].join('');
            const data = [
                align === 'left' ? '' : ` data-align="${align}"`,
                vertical === 'center' ? '' : ` data-vertical="${vertical}"`,
            ].join('');
            expect(headerTag(markup)).toBe(
                `<div class="g-md-header-plugin g-md-header-plugin_height_${height} g-md-header-plugin_width_${width}${modifiers}" data-height="${height}" data-width="${width}"${data}>`,
            );
        },
    );

    it.each(backgroundExamples)(
        'should render $id with image $image, fill $fill, theme $theme and blur $blur',
        ({attrs, modifiers, data}) => {
            const markup = example(attrs, exampleTitle, exampleContent, exampleButtons[0]);
            expect(headerTag(markup)).toBe(
                `<div class="g-md-header-plugin g-md-header-plugin_height_s g-md-header-plugin_width_m${modifiers}" data-height="s" data-width="m"${data}>`,
            );
        },
    );

    it.each(structureExamples)(
        'should render $id with image $image, title $title, description $content and $buttons buttons in the default header',
        (item) => {
            const output = preset.render(structureMarkup(item));
            expect(output.startsWith(defaultHeaderTag)).toBe(true);
            expect(output.endsWith('</div>\n')).toBe(true);
            expect(output.match(/g-md-header-plugin /g)).toHaveLength(1);
            expect(output.match(/<a /g) ?? []).toHaveLength(item.buttons);
        },
    );

    it.each(mixedExamples)(
        'should render $id with image $image, title $title, description $content and $buttons buttons in the header with every attribute',
        (item) => {
            expect(headerTag(mixedMarkup(item))).toBe(mixedTag(mixedAlign(item)));
        },
    );

    it.each([
        ['defaults-001', 'the empty header', ':::header\n:::'],
        ['defaults-002', 'the minimal title', example('', exampleTitle)],
        ['defaults-003', 'the minimal description', example('', exampleContent)],
        [
            'defaults-007',
            'the explicit defaults',
            example('height="s" width="m" align="left" vertical="center"', exampleTitle),
        ],
        [
            'defaults-008',
            'the empty title and description',
            example('', '::header-title[]', ':::header-content\n:::'),
        ],
        ['boundaries-007', 'an unknown attribute', example('unknown="value"', exampleTitle)],
        ['boundaries-008', 'an invalid height', example('height="huge"', exampleTitle)],
        [
            'boundaries-014',
            'the theme and the blur without an image',
            example('bg-image-theme="dark" bg-image-blur="true"', exampleTitle),
        ],
    ])('should render %s, %s, as the default header', (_id, _name, markup) => {
        expect(headerTag(markup)).toBe(defaultHeaderTag);
    });

    it('should render the empty header without content', () => {
        expect(preset.render(':::header\n:::')).toBe(`${defaultHeaderTag}</div>\n`);
    });
});
