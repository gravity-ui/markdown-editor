import MarkdownIt from 'markdown-it';
import {describe, expect, it} from 'vitest';

import headerPlugin, {headerHeights, headerWidths} from './index';

const md = new MarkdownIt().use(headerPlugin);

const html = (height: string, width: string) =>
    `<div class="g-md-header-plugin g-md-header-plugin_height_${height} g-md-header-plugin_width_${width}"></div>\n`;

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

    it.each([
        [':::header\nText **with formatting**\n:::', 's', 'm'],
        [':::header[Title]{width="s"}\n:::', 's', 's'],
        [':::header Title\n:::', 's', 'm'],
    ])('should keep the text of %j in the token meta', (markup, height, width) => {
        const tokens = md.parse(markup, {});
        expect(tokens.map((token) => token.type)).toEqual(['header_open', 'header_close']);
        expect(tokens[0].meta).toEqual({height, width, source: markup});
        expect(md.render(markup)).toBe(html(height, width));
    });

    it('should keep no source for an empty block', () => {
        expect(md.parse(':::header{height="m"}\n:::', {})[0].meta).toEqual({
            height: 'm',
            width: 'm',
            source: null,
        });
    });
});
