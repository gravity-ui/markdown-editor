import MarkdownIt from 'markdown-it';
import {describe, expect, it} from 'vitest';

import {
    bannerHeights,
    bannerPlugin,
    bannerTokenName,
    bannerWidths,
    buttonPlugin,
    buttonTokenName,
} from '../index';

import {bannerContentTokenName, bannerTitleTokenName} from './const';
import {bannerTitle} from './utils';

const md = new MarkdownIt().use(bannerPlugin);
const bannerOpen = `${bannerTokenName}_open`;
const bannerClose = `${bannerTokenName}_close`;
const scriptUrl = ['javascript', 'alert(1)'].join(':');

const html = (height: string, width: string) =>
    `<div class="g-md-banner-plugin g-md-banner-plugin_height_${height} g-md-banner-plugin_width_${width}" data-height="${height}" data-width="${width}"></div>\n`;

describe('Banner title Markdown', () => {
    it.each([1, 2, 3, 4, 5, 6])('should accept numeric and string heading size %i', (size) => {
        expect(bannerTitle({size})).toEqual({size, color: 'auto'});
        expect(bannerTitle({size: String(size)})).toEqual({size, color: 'auto'});
    });

    it.each(['02', '2.0', ' 2', 0, 7, true, null, {}])(
        'should use the default for unsupported heading size %j',
        (size) => {
            expect(bannerTitle({size})).toEqual({size: 2, color: 'auto'});
        },
    );

    it('should render a plain text title as a native heading', () => {
        const markup =
            '::banner-title[Text &amp; **bold** <img src=x> \\[A\\]]{size="1" color="blue"}';
        const tokens = md.parse(markup, {});
        expect(tokens.map((token) => token.type)).toEqual([
            `${bannerTitleTokenName}_open`,
            'text',
            `${bannerTitleTokenName}_close`,
        ]);
        expect(tokens[0].tag).toBe('h1');
        expect(tokens[0].attrGet('data-color')).toBe('blue');
        expect(tokens[0].attrGet('role')).toBeNull();
        expect(tokens[0].attrGet('aria-level')).toBeNull();
        expect(md.render(markup)).toBe(
            '<h1 class="g-md-banner-title-plugin g-md-banner-title-plugin_size_1 g-md-banner-title-plugin_color_blue" data-size="1" data-color="blue">\n' +
                'Text &amp;amp; **bold** &lt;img src=x&gt; [A]</h1>\n',
        );
    });

    it.each([
        ['', 'h2'],
        ['{size="3"}', 'h3'],
        ['{size="7"}', 'h2'],
    ])('should pick the heading tag for the attributes %s', (attrs, tag) => {
        expect(md.parse(`::banner-title[Title]${attrs}`, {})[0].tag).toBe(tag);
    });

    it('should preserve empty title tokens without rendering a heading', () => {
        const tokens = md.parse('::banner-title[   ]', {});
        expect(tokens.map((token) => token.type)).toEqual([
            `${bannerTitleTokenName}_open`,
            `${bannerTitleTokenName}_close`,
        ]);
        expect(tokens.every((token) => token.hidden)).toBe(true);
        expect(md.render('::banner-title[   ]')).toBe('');
    });
});

describe('Banner content Markdown', () => {
    it('should preserve formatting and resolve document references in content', () => {
        const markup =
            ':::banner-content\nFirst **paragraph**\n\n[Second][ref]\n:::\n\n[ref]: /page';
        const rendered = md.render(markup);
        expect(rendered).toContain('<p>First <strong>paragraph</strong></p>');
        expect(rendered).toContain('<p><a href="/page">Second</a></p>');
    });

    it('should ignore content attributes and keep the following button inside the banner', () => {
        const markup =
            ':::banner\n:::banner-content{size="1"}\nDescription\n:::\n\n:button[Open](/page)\n:::';
        const tokens = new MarkdownIt().use(bannerPlugin).use(buttonPlugin).parse(markup, {});
        expect(tokens.map((token) => token.type)).toEqual([
            bannerOpen,
            `${bannerContentTokenName}_open`,
            'paragraph_open',
            'inline',
            'paragraph_close',
            `${bannerContentTokenName}_close`,
            'paragraph_open',
            'inline',
            'paragraph_close',
            bannerClose,
        ]);
        expect(tokens[1].attrs).toEqual([['class', 'g-md-banner-content-plugin']]);
        expect(tokens[7].children?.map((token) => token.type)).toContain(buttonTokenName);
    });

    it('should preserve empty content tokens without rendering a container', () => {
        const markup = ':::banner-content\n\n:::';
        const tokens = md.parse(markup, {});
        expect(tokens.map((token) => token.type)).toEqual([
            `${bannerContentTokenName}_open`,
            `${bannerContentTokenName}_close`,
        ]);
        expect(tokens.every((token) => token.hidden)).toBe(true);
        expect(md.render(markup)).toBe('');
    });

    it.each([':::banner-content[Title]', ':::banner-content(link)', ':::banner-content Title'])(
        'should leave unsupported opening syntax as Markdown in %j',
        (opening) => {
            const markup = `${opening}\nText\n:::`;
            expect(
                md
                    .parse(markup, {})
                    .some((token) => token.type === `${bannerContentTokenName}_open`),
            ).toBe(false);
        },
    );
});

describe('Banner Markdown', () => {
    for (const height of bannerHeights) {
        for (const width of bannerWidths) {
            it(`should render height ${height} and width ${width}`, () => {
                const markup = `:::banner{height="${height}" width="${width}"}\n:::`;
                expect(md.render(markup)).toBe(html(height, width));
            });
        }
    }

    it.each([
        [':::banner\n:::', 's', 'm'],
        [':::banner{width=full}\n:::', 's', 'full'],
        [":::banner{height='l'}\n:::", 'l', 'm'],
    ])('should apply independent defaults for %j', (markup, height, width) => {
        expect(md.render(markup)).toBe(html(height, width));
    });

    it.each([
        ':::banner{color="red"}\n:::',
        ':::banner{.custom #id}\n:::',
        ':::banner{onclick="alert(1)"}\n:::',
    ])('should skip an unsupported attribute in %j', (markup) => {
        expect(md.render(markup)).toBe(html('s', 'm'));
    });

    it.each([
        [':::banner{height="xl" color="red"}\n:::', 's', 'm'],
        [':::banner{height="m" width="100%"}\n:::', 'm', 'm'],
        [':::banner{width="full" width="s"}\n:::', 's', 'm'],
        [':::banner{height="<script>alert(1)</script>"}\n:::', 's', 'm'],
    ])('should use the default for an unsupported value in %j', (markup, height, width) => {
        expect(md.render(markup)).toBe(html(height, width));
    });

    it('should parse child blocks in the container token stream', () => {
        const markup = ':::banner\nText **with formatting**\n:::';
        const tokens = md.parse(markup, {});
        expect(tokens.map((token) => token.type)).toEqual([
            bannerOpen,
            'paragraph_open',
            'inline',
            'paragraph_close',
            bannerClose,
        ]);
        expect(tokens[0].attrGet('data-height')).toBe('s');
        expect(tokens[0].attrGet('data-width')).toBe('m');
        expect(md.render(markup)).toContain('<p>Text <strong>with formatting</strong></p>');
    });

    it.each([':::banner[Title]{width="s"}\n:::', ':::banner(link)\n:::', ':::banner Title\n:::'])(
        'should leave unsupported opening syntax as Markdown in %j',
        (markup) => {
            expect(md.parse(markup, {}).some((token) => token.type === bannerOpen)).toBe(false);
        },
    );

    it('should preserve nested containers and paragraphs after them', () => {
        const tokens = md.parse(':::banner\n:::banner\nInner\n:::\nOuter\n:::', {});
        expect(tokens.filter((token) => token.type === bannerOpen)).toHaveLength(2);
        expect(tokens.filter((token) => token.type === bannerClose)).toHaveLength(2);
        expect(tokens[tokens.length - 1].type).toBe(bannerClose);
        expect(
            tokens.filter((token) => token.type === 'inline').map((token) => token.content),
        ).toEqual(['Inner', 'Outer']);
    });

    const expectContainer = (markup: string, contents: string[]) => {
        const tokens = md.parse(markup, {});
        expect(tokens[0].type).toBe(bannerOpen);
        expect(tokens[tokens.length - 1].type).toBe(bannerClose);
        expect(
            tokens.filter((token) => token.type === 'inline').map((token) => token.content),
        ).toEqual(contents);
    };

    it.each([
        [':::banner\n- a\n- b\n:::', ['a', 'b']],
        [':::banner\n1. a\n2. b\n:::', ['a', 'b']],
        [':::banner\n- a\n  - b\n:::', ['a', 'b']],
        [':::banner\n> a\n:::', ['a']],
        [':::banner\n:::banner\n- a\n:::\n- b\n:::', ['a', 'b']],
        [':::banner\n| a |\n| - |\n| b |\n:::', ['a', 'b']],
    ])('should close the container right after a child block in %j', expectContainer);

    it.each([':::banner\nUnclosed', '    :::banner\n    :::'])(
        'should leave incomplete or indented directives as Markdown in %j',
        (markup) => {
            expect(md.parse(markup, {}).some((token) => token.type === bannerOpen)).toBe(false);
        },
    );

    it('should preserve an incomplete directive inside a paragraph', () => {
        const markup = 'Before\n:::banner\nUnclosed';
        expect(md.render(markup)).toBe(new MarkdownIt().render(markup));
    });

    it('should resolve references from child blocks in the document environment', () => {
        const markup = ':::banner\n[inside][ref]\n:::\n\n[ref]: https://example.com';
        expect(md.render(markup)).toContain('<a href="https://example.com">inside</a>');
    });

    it('should assign independent default dimensions to an empty block', () => {
        const [token] = md.parse(':::banner{height="s"}\n:::', {});
        expect(token.attrGet('data-height')).toBe('s');
        expect(token.attrGet('data-width')).toBe('m');
    });

    it.each([
        [scriptUrl, null],
        ['data:text/html;base64,PHNjcmlwdD4=', null],
        ['https://cdn.example.com/a b.png', 'https://cdn.example.com/a%20b.png'],
        ['/images/banner.png', '/images/banner.png'],
    ])('should check the background image %j like a Markdown image', (address, expected) => {
        const [token] = md.parse(`:::banner{bg-image="${address}"}\n:::`, {});
        expect(token.attrGet('data-bg-image')).toBe(expected);
    });
});
