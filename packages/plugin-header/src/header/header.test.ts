import MarkdownIt from 'markdown-it';
import {describe, expect, it} from 'vitest';

import {
    headerAligns,
    headerAttrs,
    headerBgColors,
    headerHeights,
    headerLayout,
    headerLayoutDefaults,
    headerLayoutFromAttrs,
    headerLayoutValues,
    headerPlugin,
    headerRender,
    headerTokenName,
    headerVerticals,
    headerWidths,
    toCssUrl,
} from '../index';

const md = new MarkdownIt().use(headerPlugin);
const headerOpen = `${headerTokenName}_open`;
const headerClose = `${headerTokenName}_close`;

const html = (height: string, width: string) =>
    `<div class="g-md-header-plugin g-md-header-plugin_height_${height} g-md-header-plugin_width_${width}" data-height="${height}" data-width="${width}"></div>\n`;

describe('Header Markdown', () => {
    for (const height of headerHeights) {
        for (const width of headerWidths) {
            it(`should render height ${height} and width ${width}`, () => {
                const markup = `:::header{height="${height}" width="${width}"}\n:::`;
                expect(md.render(markup)).toBe(html(height, width));
            });
        }
    }

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
            headerOpen,
            'paragraph_open',
            'inline',
            'paragraph_close',
            headerClose,
        ]);
        expect(tokens[0].attrGet('data-height')).toBe('s');
        expect(tokens[0].attrGet('data-width')).toBe('m');
        expect(md.render(markup)).toContain('<p>Text <strong>with formatting</strong></p>');
    });

    it.each([':::header[Title]{width="s"}\n:::', ':::header(link)\n:::', ':::header Title\n:::'])(
        'should leave unsupported opening syntax as Markdown in %j',
        (markup) => {
            expect(md.parse(markup, {}).some((token) => token.type === headerOpen)).toBe(false);
        },
    );

    it('should preserve nested containers and paragraphs after them', () => {
        const tokens = md.parse(':::header\n:::header\nInner\n:::\nOuter\n:::', {});
        expect(tokens.filter((token) => token.type === headerOpen)).toHaveLength(2);
        expect(tokens.filter((token) => token.type === headerClose)).toHaveLength(2);
        expect(tokens[tokens.length - 1].type).toBe(headerClose);
        expect(
            tokens.filter((token) => token.type === 'inline').map((token) => token.content),
        ).toEqual(['Inner', 'Outer']);
    });

    const expectContainer = (markup: string, contents: string[]) => {
        const tokens = md.parse(markup, {});
        expect(tokens[0].type).toBe(headerOpen);
        expect(tokens[tokens.length - 1].type).toBe(headerClose);
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
            expect(md.parse(markup, {}).some((token) => token.type === headerOpen)).toBe(false);
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
        expect(toCssUrl(url)).toBeNull();
        expect(md.render(`:::header{bg-image="${url}" bg-image-theme="dark"}\n:::`)).toBe(
            html('s', 'm'),
        );
    });

    it('should encode quotes, brackets, and comments in the CSS address', () => {
        const url = `a.png") ;background:url(${scriptUrl}) /*'\\`;
        expect(toCssUrl(url)).toBe(
            'url("a.png%22%29%20;background:url%28javascript:alert%281%29%29%20/%2A%27%5C")',
        );
    });

    it.each([
        {'bg-image': './a (1).png', 'bg-image-theme': 'dark', 'bg-image-blur': true},
        {'bg-color': 'blue-light', 'bg-image': scriptUrl},
        {},
    ])('should give the classes and the image of the attributes of %j', (attrs) => {
        const {className, backgroundImage, data} = headerRender(attrs);
        const image = typeof attrs['bg-image'] === 'string' ? toCssUrl(attrs['bg-image']) : null;
        expect(backgroundImage).toBe(image);
        expect(headerAttrs(attrs)).toEqual({
            class: className,
            ...data,
            ...(image ? {style: `background-image:${image}`} : {}),
        });
    });

    it('should escape quotes of the image address in HTML', () => {
        const output = md.render(':::header{bg-image="a\\".png"}\n:::');
        expect(output).toContain('data-bg-image="a&quot;.png"');
        expect(output).toContain('style="background-image:url(&quot;a%22.png&quot;)"');
    });
});

describe('Header layout', () => {
    const block = (modifiers: string, attrs: string) =>
        `<div class="g-md-header-plugin g-md-header-plugin_height_s g-md-header-plugin_width_m${modifiers}" data-height="s" data-width="m"${attrs}></div>\n`;

    it.each([
        {
            markup: 'align="center"',
            modifiers: ' g-md-header-plugin_align_center',
            attrs: ' data-align="center"',
        },
        {
            markup: 'align="right"',
            modifiers: ' g-md-header-plugin_align_right',
            attrs: ' data-align="right"',
        },
        {
            markup: 'vertical="top"',
            modifiers: ' g-md-header-plugin_vertical_top',
            attrs: ' data-vertical="top"',
        },
        {
            markup: 'vertical="bottom"',
            modifiers: ' g-md-header-plugin_vertical_bottom',
            attrs: ' data-vertical="bottom"',
        },
        {
            markup: 'align="right" vertical="top"',
            modifiers: ' g-md-header-plugin_align_right g-md-header-plugin_vertical_top',
            attrs: ' data-align="right" data-vertical="top"',
        },
    ])('should render $markup', ({markup, modifiers, attrs}) => {
        expect(md.render(`:::header{${markup}}\n:::`)).toBe(block(modifiers, attrs));
    });

    it.each([
        'align="left"',
        'vertical="center"',
        'align="left" vertical="center"',
        'align="justify"',
        'vertical="middle"',
        'align=""',
    ])('should render the default layout for %s', (markup) => {
        expect(md.render(`:::header{${markup}}\n:::`)).toBe(html('s', 'm'));
    });

    it.each(
        headerAligns.flatMap((align) => headerVerticals.map((vertical) => ({align, vertical}))),
    )('should read $align and $vertical back from the element', ({align, vertical}) => {
        const attrs = headerAttrs({align, vertical});
        expect(headerLayoutFromAttrs((name) => attrs[name])).toEqual({align, vertical});
        expect(headerLayoutValues(headerLayout({align, vertical}))).toEqual({
            ...(align === headerLayoutDefaults.align ? {} : {align}),
            ...(vertical === headerLayoutDefaults.vertical ? {} : {vertical}),
        });
    });
});
