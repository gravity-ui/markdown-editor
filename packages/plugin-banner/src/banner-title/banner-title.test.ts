import MarkdownIt from 'markdown-it';
import {describe, expect, it} from 'vitest';

import {
    bannerPlugin,
    bannerTitleColors,
    bannerTitlePlugin,
    bannerTitleSizes,
    bannerTitleTokenName,
} from '../index';

const md = new MarkdownIt().use(bannerPlugin).use(bannerTitlePlugin);
const banner = (content: string) =>
    `<div class="g-md-banner-plugin g-md-banner-plugin_height_s g-md-banner-plugin_width_m" data-height="s" data-width="m">\n${content}</div>\n`;
const title = (classes: string, data: string, text: string) =>
    `<div class="g-md-banner-title-plugin ${classes}"${data}>${text}</div>\n`;

describe('Banner title Markdown', () => {
    it.each(bannerTitleSizes)('should render size %i', (size) => {
        const data = size === 2 ? '' : ` data-size="${size}"`;
        expect(md.render(`::banner-title[Title]{size=${size}}`)).toBe(
            title(`g-md-banner-title-plugin_size_${size}`, data, 'Title'),
        );
    });

    it.each(bannerTitleColors)('should render color %s', (color) => {
        const modifier = color === 'auto' ? '' : ` g-md-banner-title-plugin_color_${color}`;
        const data = color === 'auto' ? '' : ` data-color="${color}"`;
        expect(md.render(`::banner-title[Title]{color="${color}"}`)).toBe(
            title(`g-md-banner-title-plugin_size_2${modifier}`, data, 'Title'),
        );
    });

    it.each([
        '::banner-title[Title]',
        '::banner-title[Title]{size=7 color="pink"}',
        '::banner-title[Title]{size="1.0" color=""}',
    ])('should use the defaults for %j', (markup) => {
        expect(md.render(markup)).toBe(title('g-md-banner-title-plugin_size_2', '', 'Title'));
    });

    it('should escape the title text', () => {
        expect(md.render('::banner-title[<b>x</b> & \\[y\\] \\*z\\*]')).toBe(
            title('g-md-banner-title-plugin_size_2', '', '&lt;b&gt;x&lt;/b&gt; &amp; [y] *z*'),
        );
    });

    it('should render nothing for an empty title', () => {
        expect(md.render(':::banner\n::banner-title[]\n:::')).toBe(banner(''));
    });

    it('should keep the second title of a banner as a paragraph', () => {
        expect(md.render(':::banner\n::banner-title[One]\n::banner-title[Two]\n:::')).toBe(
            banner(
                title('g-md-banner-title-plugin_size_2', '', 'One') +
                    '<p>::banner-title[Two]</p>\n',
            ),
        );
    });

    it('should give a nested banner its own title', () => {
        const tokens = md.parse(
            ':::banner\n:::banner\n::banner-title[Inner]\n:::\n::banner-title[Outer]\n:::',
            {},
        );
        expect(
            tokens
                .filter((token) => token.type === bannerTitleTokenName)
                .map((token) => token.content),
        ).toEqual(['Inner', 'Outer']);
    });
});
