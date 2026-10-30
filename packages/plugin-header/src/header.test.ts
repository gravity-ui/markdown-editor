import MarkdownIt from 'markdown-it';
import {describe, expect, it} from 'vitest';

import {headerPlugin, isHeaderSource} from './index';

const md = new MarkdownIt().use(headerPlugin);

describe('Header Markdown', () => {
    for (const height of ['s', 'm', 'l']) {
        for (const width of ['s', 'm', 'l', 'full']) {
            it(`should render height ${height} and width ${width}`, () => {
                expect(md.render(`:::header{height="${height}" width="${width}"}\n:::`)).toBe(
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
    ])('should apply independent defaults for %s', (markup, height, width) => {
        expect(md.render(markup)).toContain(`data-height="${height}" data-width="${width}"`);
    });

    it.each([
        ':::header{height="xl"}\n:::',
        ':::header{width="100%"}\n:::',
        ':::header{width="full" width="s"}\n:::',
        ':::header{height="s"width="l"}\n:::',
        ':::header{height="s}\n:::',
        ':::header{style="color:red"}\n:::',
        ':::header{width="s" onclick="alert(1)"}\n:::',
        ':::header{height="<script>alert(1)</script>"}\n:::',
        ':::header[Title]{width="s"}\n:::',
        ':::header\nText **with formatting**\n:::',
        ':::header\n:::header\n:::\n:::',
        ':::header{width="s"}',
        ':::header\n```\n:::\n```\n:::',
        ':::header\n~~~~\n:::\n~~~\n~~~~\n:::',
    ])('should preserve unsupported source safely for %s', (markup) => {
        const tokens = md.parse(markup, {});
        expect(tokens).toHaveLength(1);
        expect(tokens[0].type).toBe('header_source');
        expect(tokens[0].content).toBe(markup);
        expect(md.render(markup)).toBe(`<pre><code>${md.utils.escapeHtml(markup)}</code></pre>\n`);
    });

    it('should keep adjacent paragraphs and header boundaries', () => {
        const tokens = md.parse('Before\n:::header\n:::\nAfter', {});
        expect(tokens.map(({type}) => type)).toEqual([
            'paragraph_open',
            'inline',
            'paragraph_close',
            'header',
            'paragraph_open',
            'inline',
            'paragraph_close',
        ]);
        expect(tokens[3].map).toEqual([1, 3]);
    });

    it('should leave code fences and indented code unchanged', () => {
        expect(md.parse('```\n:::header\n:::\n```', {})[0].type).toBe('fence');
        expect(md.parse('    :::header\n    :::', {})[0].type).toBe('code_block');
    });

    it('should parse an empty header inside a blockquote', () => {
        expect(md.render('> :::header{width="s"}\n> :::')).toBe(
            '<blockquote>\n<div class="g-md-header" data-height="s" data-width="s"></div>\n</blockquote>\n',
        );
    });

    it.each([
        [':::header\nText\n:::', true],
        [':::header\nUnclosed text', true],
        [':::header\n:::', false],
        ['<img src=x onerror=alert(1)>', false],
        [':::header\nText\n:::\n<img src=x onerror=alert(1)>', false],
    ])('should recognize unsupported header source in %j', (source, expected) => {
        expect(isHeaderSource(source)).toBe(expected);
    });
});
