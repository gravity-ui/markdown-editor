import MarkdownIt from 'markdown-it';
import {describe, expect, it} from 'vitest';

import {bannerBgColors, bannerPlugin, bannerTokenName} from '../index';

const md = new MarkdownIt().use(bannerPlugin);
const scriptUrl = ['javascript', 'alert(1)'].join(':');
const base = 'g-md-banner-plugin g-md-banner-plugin_height_s g-md-banner-plugin_width_m';

const bannerToken = (markup: string) =>
    md.parse(markup, {}).find((token) => token.type === `${bannerTokenName}_open`);

describe('Banner background Markdown', () => {
    it.each(bannerBgColors)('should render the %s fill', (color) => {
        expect(md.render(`:::banner{bg-color="${color}"}\n:::`)).toBe(
            `<div class="${base} g-md-banner-plugin_bg-color_${color}" data-height="s" data-width="m" data-bg-color="${color}"></div>\n`,
        );
    });

    it('should render the image with an escaped address, the theme and the blur', () => {
        const markup =
            ':::banner{bg-image="/a b(1)\'*.png" bg-theme="dark" bg-image-blur="true"}\n:::';
        expect(md.render(markup)).toBe(
            `<div class="${base} g-md-banner-plugin_bg-image g-md-banner-plugin_bg-image-blur g-root g-root_theme_dark" data-height="s" data-width="m" data-bg-image="/a b(1)'*.png" data-bg-theme="dark" data-bg-image-blur="true" style="background-image:url(&quot;/a b\\28 1\\29 \\27 \\2a .png&quot;)"></div>\n`,
        );
    });

    it.each([
        ['light', 'g-root g-root_theme_light'],
        ['system', undefined],
    ])('should render the %s theme of the image', (theme, classes) => {
        const token = bannerToken(`:::banner{bg-image="/a.png" bg-theme="${theme}"}\n:::`);
        expect(token?.attrGet('class')?.includes('g-root')).toBe(Boolean(classes));
        if (classes) expect(token?.attrGet('class')).toContain(classes);
    });

    it.each([scriptUrl, 'vbscript:alert(1)', 'data:image/png;base64,AAAA', ' ', '/a\u0007.png'])(
        'should reject the unsafe image address %j with its theme and blur',
        (address) => {
            const token = bannerToken(
                `:::banner{bg-image="${address}" bg-theme="dark" bg-image-blur="true"}\n:::`,
            );
            expect(token?.attrGet('class')).toBe(base);
            expect(token?.attrGet('style')).toBeNull();
            expect(token?.attrGet('data-bg-image')).toBeNull();
            expect(token?.attrGet('data-bg-theme')).toBeNull();
        },
    );

    it('should keep the fill under an image', () => {
        const token = bannerToken(
            ':::banner{bg-color="red-heavy" bg-image="https://example.com/a.png"}\n:::',
        );
        expect(token?.attrGet('class')).toContain('g-md-banner-plugin_bg-color_red-heavy');
        expect(token?.attrGet('style')).toBe('background-image:url("https://example.com/a.png")');
    });

    it('should use the default for an unsupported fill', () => {
        expect(bannerToken(':::banner{bg-color="pink-light"}\n:::')?.attrGet('class')).toBe(base);
    });
});
