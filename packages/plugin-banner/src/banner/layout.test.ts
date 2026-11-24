import MarkdownIt from 'markdown-it';
import {describe, expect, it} from 'vitest';

import {
    bannerAligns,
    bannerContentPlugin,
    bannerImagePlugin,
    bannerPlugin,
    bannerTitlePlugin,
    bannerVerticals,
} from '../index';

const md = new MarkdownIt()
    .use(bannerPlugin)
    .use(bannerTitlePlugin)
    .use(bannerContentPlugin)
    .use(bannerImagePlugin);

const open = (modifiers: string, data: string) =>
    `<div class="g-md-banner-plugin g-md-banner-plugin_height_s g-md-banner-plugin_width_m${modifiers}" data-height="s" data-width="m"${data}>`;

describe('Banner layout Markdown', () => {
    for (const align of bannerAligns) {
        for (const vertical of bannerVerticals) {
            it(`should render align ${align} and vertical ${vertical}`, () => {
                const modifiers = [
                    align === 'left' ? '' : ` g-md-banner-plugin_align_${align}`,
                    vertical === 'center' ? '' : ` g-md-banner-plugin_vertical_${vertical}`,
                ].join('');
                const data = [
                    align === 'left' ? '' : ` data-align="${align}"`,
                    vertical === 'center' ? '' : ` data-vertical="${vertical}"`,
                ].join('');
                const markup = `:::banner{align="${align}" vertical="${vertical}"}\n:::`;
                expect(md.render(markup)).toBe(`${open(modifiers, data)}</div>\n`);
                const [token] = md.parse(markup, {});
                expect(token.attrGet('data-align')).toBe(align === 'left' ? null : align);
                expect(token.attrGet('data-vertical')).toBe(
                    vertical === 'center' ? null : vertical,
                );
            });
        }
    }

    it('should use the defaults for unsupported values', () => {
        expect(md.render(':::banner{align="justify" vertical="middle"}\n:::')).toBe(
            `${open('', '')}</div>\n`,
        );
    });

    it('should keep the source order of the child blocks', () => {
        const html = md.render(
            ':::banner\n:::banner-content\nText\n:::\n::banner-title[Title]\n::banner-image{src="/a.png"}\n:::',
        );
        const content = html.indexOf('g-md-banner-content-plugin');
        const title = html.indexOf('g-md-banner-title-plugin');
        const image = html.indexOf('g-md-banner-image-plugin');
        expect(content).toBeGreaterThan(0);
        expect(title).toBeGreaterThan(content);
        expect(image).toBeGreaterThan(title);
    });
});
