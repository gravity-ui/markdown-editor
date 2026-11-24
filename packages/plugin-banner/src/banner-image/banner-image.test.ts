import MarkdownIt from 'markdown-it';
import {describe, expect, it} from 'vitest';

import {bannerImagePlugin, bannerPlugin} from '../index';

const md = new MarkdownIt().use(bannerPlugin).use(bannerImagePlugin);
const banner = (content: string) =>
    `<div class="g-md-banner-plugin g-md-banner-plugin_height_s g-md-banner-plugin_width_m" data-height="s" data-width="m">\n${content}</div>\n`;
const image = (attrs: string) =>
    `<img class="g-md-banner-image-plugin" data-files-gallery-exclude="true" ${attrs}>\n`;

describe('Banner image Markdown', () => {
    it('should render the image with escaped attributes', () => {
        expect(md.render('::banner-image{src="/a.png?x=1&y=2" alt="A & \\"b\\"" title="T"}')).toBe(
            image('src="/a.png?x=1&amp;y=2" alt="A &amp; &quot;b&quot;" title="T"'),
        );
    });

    it.each(['https://example.com/a.png', 'http://example.com/a.png', 'blob:https://a/1', 'a.png'])(
        'should render the address %j',
        (src) => {
            expect(md.render(`::banner-image{src="${src}"}`)).toBe(image(`src="${src}" alt=""`));
        },
    );

    it('should skip an empty title', () => {
        expect(md.render('::banner-image{src="/a.png" title=""}')).toBe(
            image('src="/a.png" alt=""'),
        );
    });

    it.each([
        ['javascript', 'alert(1)'].join(':'),
        'data:image/png;base64,AAAA',
        'vbscript:x',
        ' ',
        'a\u0001.png',
    ])('should render nothing for the unsafe address %j', (src) => {
        expect(md.render(`::banner-image{src="${src}"}`)).toBe('');
    });

    it('should render nothing without an address', () => {
        expect(md.render('::banner-image')).toBe('');
    });

    it('should keep the second image of a banner as text', () => {
        expect(
            md.render(':::banner\n::banner-image{src="/a.png"}\n::banner-image{src="/b.png"}\n:::'),
        ).toBe(
            banner(
                image('src="/a.png" alt=""') + '<p>::banner-image{src=&quot;/b.png&quot;}</p>\n',
            ),
        );
    });

    it('should give a nested banner its own image', () => {
        expect(
            md.render(
                ':::banner\n::banner-image{src="/a.png"}\n:::banner\n::banner-image{src="/b.png"}\n:::\n:::',
            ),
        ).toBe(banner(image('src="/a.png" alt=""') + banner(image('src="/b.png" alt=""'))));
    });

    it('should keep a directive with a label as text', () => {
        expect(md.render('::banner-image[x]{src="/a.png"}')).toBe(
            '<p>::banner-image[x]{src=&quot;/a.png&quot;}</p>\n',
        );
    });
});
