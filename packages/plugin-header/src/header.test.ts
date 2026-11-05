import MarkdownIt from 'markdown-it';
import {describe, expect, it} from 'vitest';

import headerPlugin, {headerHeights, headerWidths, serializeHeader} from './index';

const md = new MarkdownIt().use(headerPlugin);

describe('Header Markdown', () => {
    for (const height of headerHeights) {
        for (const width of headerWidths) {
            it(`should render height ${height} and width ${width}`, () => {
                expect(md.render(serializeHeader({height, width}))).toBe(
                    `<div class="g-md-header-plugin" data-height="${height}" data-width="${width}"></div>\n`,
                );
            });
        }
    }

    it.each([
        [':::header\n:::', 's', 'm'],
        [':::header{width=full}\n:::', 's', 'full'],
        [":::header{height='l'}\n:::", 'l', 'm'],
    ])('should apply independent defaults for %j', (markup, height, width) => {
        expect(md.render(markup)).toContain(`data-height="${height}" data-width="${width}"`);
    });

    it.each([
        ':::header{color="red"}\n:::',
        ':::header{.custom #id}\n:::',
        ':::header{onclick="alert(1)"}\n:::',
    ])('should skip an unsupported attribute in %j', (markup) => {
        expect(md.render(markup)).toBe(
            '<div class="g-md-header-plugin" data-height="s" data-width="m"></div>\n',
        );
    });

    it.each([
        [':::header{height="xl" color="red"}\n:::', 's', 'm'],
        [':::header{height="m" width="100%"}\n:::', 'm', 'm'],
        [':::header{width="full" width="s"}\n:::', 's', 'm'],
        [':::header{height="<script>alert(1)</script>"}\n:::', 's', 'm'],
    ])('should use the default for an unsupported value in %j', (markup, height, width) => {
        expect(md.render(markup)).toBe(
            `<div class="g-md-header-plugin" data-height="${height}" data-width="${width}"></div>\n`,
        );
    });

    it.each([
        ':::header\nText **with formatting**\n:::',
        ':::header[Title]{width="s"}\n:::',
        ':::header Title\n:::',
    ])('should render text in %j as escaped source', (markup) => {
        const tokens = md.parse(markup, {});
        expect(tokens).toHaveLength(1);
        expect(tokens[0].type).toBe('header_source');
        expect(tokens[0].content).toBe(markup);
        expect(md.render(markup)).toBe(`<pre><code>${md.utils.escapeHtml(markup)}</code></pre>\n`);
    });
});
