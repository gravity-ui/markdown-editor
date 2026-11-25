import MarkdownIt from 'markdown-it';
import {describe, expect, it} from 'vitest';

import {bannerHeights, bannerPlugin, bannerTokenName, bannerWidths} from '../index';

const md = new MarkdownIt().use(bannerPlugin);
const bannerOpen = `${bannerTokenName}_open`;
const bannerClose = `${bannerTokenName}_close`;
const scriptUrl = ['javascript', 'alert(1)'].join(':');

const html = (height: string, width: string) =>
    `<div class="g-md-banner-plugin g-md-banner-plugin_height_${height} g-md-banner-plugin_width_${width}" data-height="${height}" data-width="${width}"></div>\n`;

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
