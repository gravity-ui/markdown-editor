import MarkdownIt from 'markdown-it';
import {describe, expect, it} from 'vitest';

import {bannerContentPlugin, bannerPlugin, bannerTitlePlugin} from '../index';

const md = new MarkdownIt().use(bannerPlugin).use(bannerTitlePlugin).use(bannerContentPlugin);
const banner = (content: string) =>
    `<div class="g-md-banner-plugin g-md-banner-plugin_height_s g-md-banner-plugin_width_m" data-height="s" data-width="m">\n${content}</div>\n`;
const content = (blocks: string) => `<div class="g-md-banner-content-plugin">\n${blocks}</div>\n`;
const title = (text: string) =>
    `<div class="g-md-banner-title-plugin g-md-banner-title-plugin_size_2">${text}</div>\n`;

describe('Banner description Markdown', () => {
    it('should render formatted text', () => {
        expect(
            md.render(
                ':::banner\n:::banner-content\nText **bold** [link](https://a.b)\n\n- item\n:::\n:::',
            ),
        ).toBe(
            banner(
                content(
                    '<p>Text <strong>bold</strong> <a href="https://a.b">link</a></p>\n' +
                        '<ul>\n<li>item</li>\n</ul>\n',
                ),
            ),
        );
    });

    it('should render nothing for an empty description', () => {
        expect(md.render(':::banner\n:::banner-content\n:::\n:::')).toBe(banner(''));
    });

    it('should keep the blocks of the second description in the banner', () => {
        expect(
            md.render(':::banner\n:::banner-content\nOne\n:::\n:::banner-content\nTwo\n:::\n:::'),
        ).toBe(banner(content('<p>One</p>\n') + '<p>Two</p>\n'));
    });

    it('should keep the title of a second description when the banner has no title', () => {
        expect(
            md.render(
                ':::banner\n:::banner-content\nOne\n:::\n:::banner-content\n::banner-title[Inner]\nTwo\n:::\n:::',
            ),
        ).toBe(banner(content('<p>One</p>\n') + title('Inner') + '<p>Two</p>\n'));
    });

    it('should keep the title of a second description as text when the banner has a title', () => {
        expect(
            md.render(
                ':::banner\n::banner-title[Title]\n:::banner-content\nOne\n:::\n' +
                    ':::banner-content\n::banner-title[Inner]\nTwo\n:::\n:::',
            ),
        ).toBe(
            banner(
                title('Title') +
                    content('<p>One</p>\n') +
                    '<p>::banner-title[Inner]</p>\n<p>Two</p>\n',
            ),
        );
    });

    it('should keep a description outside a banner', () => {
        expect(md.render(':::banner-content\nOut\n:::')).toBe(content('<p>Out</p>\n'));
    });
});
