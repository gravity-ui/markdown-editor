import MarkdownIt from 'markdown-it';
import {describe, expect, it} from 'vitest';

import headerPlugin, {
    headerHeights,
    headerWidths,
    isHeaderHeight,
    isHeaderWidth,
    serializeHeader,
} from './index';

const md = new MarkdownIt().use(headerPlugin);

describe('Header Markdown', () => {
    for (const height of headerHeights) {
        for (const width of headerWidths) {
            it(`should render height ${height} and width ${width}`, () => {
                expect(md.render(serializeHeader({height, width}))).toBe(
                    `<div class="g-md-header" data-height="${height}" data-width="${width}"></div>\n`,
                );
            });
        }
    }

    it.each([
        [':::header\n:::', 's', 'm'],
        [':::header{}\n\n:::', 's', 'm'],
        [':::header{width=full}\n:::', 's', 'full'],
        [":::header{height='l'}\n:::", 'l', 'm'],
        [':::header{width="s" height="m"}\n:::', 'm', 's'],
    ])('should apply independent defaults for %j', (markup, height, width) => {
        expect(md.render(markup)).toContain(`data-height="${height}" data-width="${width}"`);
    });

    it.each([
        ':::header{height="xl"}\n:::',
        ':::header{width="100%"}\n:::',
        ':::header{width="full" width="s"}\n:::',
        ':::header{height="s"width="l"}\n:::',
        ':::header{height="s}\n:::',
        ':::header{style="color:red"}\n:::',
        ':::header{.custom}\n:::',
        ':::header{width="s" onclick="alert(1)"}\n:::',
        ':::header{height="<script>alert(1)</script>"}\n:::',
        ':::header[Title]{width="s"}\n:::',
        ':::header(https://example.com)\n:::',
        ':::header Title\n:::',
        ':::header\nText **with formatting**\n:::',
        ':::header\n:::header\n:::\n:::',
    ])('should render unsupported container %j as escaped source', (markup) => {
        const tokens = md.parse(markup, {});
        expect(tokens).toHaveLength(1);
        expect(tokens[0].type).toBe('header_source');
        expect(tokens[0].content).toBe(markup);
        expect(md.render(markup)).toBe(`<pre><code>${md.utils.escapeHtml(markup)}</code></pre>\n`);
    });

    it('should leave an unclosed container as a paragraph', () => {
        expect(md.parse(':::header{width="s"}', {})[0].type).toBe('paragraph_open');
    });

    it('should keep paragraphs around the block', () => {
        const tokens = md.parse('Before\n\n:::header\n:::\n\nAfter', {});
        expect(tokens.map(({type}) => type)).toEqual([
            'paragraph_open',
            'inline',
            'paragraph_close',
            'header_open',
            'header_close',
            'paragraph_open',
            'inline',
            'paragraph_close',
        ]);
        expect(tokens[3].map).toEqual([2, 4]);
    });

    it('should leave code fences and indented code unchanged', () => {
        expect(md.parse('```\n:::header\n:::\n```', {})[0].type).toBe('fence');
        expect(md.parse('    :::header\n    :::', {})[0].type).toBe('code_block');
    });

    it('should render the block and its source inside a blockquote', () => {
        expect(md.render('> :::header{width="s"}\n> :::')).toBe(
            '<blockquote>\n<div class="g-md-header" data-height="s" data-width="s"></div>\n</blockquote>\n',
        );
        expect(md.parse('> :::header\n> Text\n> :::', {})[1].content).toBe(':::header\nText\n:::');
    });

    it('should accept only listed sizes', () => {
        expect(headerHeights.every(isHeaderHeight)).toBe(true);
        expect(headerWidths.every(isHeaderWidth)).toBe(true);
        expect([isHeaderHeight('full'), isHeaderWidth('xl'), isHeaderHeight(['s'])]).toEqual([
            false,
            false,
            false,
        ]);
    });
});
