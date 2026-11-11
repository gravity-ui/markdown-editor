import MarkdownIt from 'markdown-it';
import {describe, expect, it} from 'vitest';

import {headerHeights, headerPlugin, headerWidths} from '../index';

const md = new MarkdownIt().use(headerPlugin);

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
