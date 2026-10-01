import {describe, expect, it} from 'vitest';

import {normalizeHeaderAttrs} from './attrs';
import {headerDomAttrs, headerHtml, toCssUrl} from './dom';

const image = 'https://example.com/hero.png';
const domAttrs = (patch: Record<string, unknown>) => headerDomAttrs(normalizeHeaderAttrs(patch));

describe('header dom', () => {
    it('should expose the background and image settings through data attributes', () => {
        const attrs = domAttrs({
            bg: 'gradient',
            fill: 'indigo',
            fill2: 'violet',
            direction: 'down',
            image,
            layer: 'object',
            fit: 'whole',
            focus: 'right',
        });
        expect(attrs).toMatchObject({
            'data-bg': 'gradient',
            'data-fill': 'indigo',
            'data-fill2': 'violet',
            'data-direction': 'down',
            'data-layer': 'object',
            'data-fit': 'whole',
            'data-focus': 'right',
        });
        expect(attrs.style).toContain(`--g-md-header-image:url("${image}")`);
    });

    it('should include decorative shapes beneath the content', () => {
        const html = headerHtml(normalizeHeaderAttrs({bg: 'mesh'}), 'Заголовок', (value) => value);
        expect(html).toContain('g-md-header__shape');
        expect(html.indexOf('g-md-header__shape')).toBeLessThan(html.indexOf('g-md-header__title'));
    });

    it('should encode unsafe characters in CSS URLs', () => {
        expect(toCssUrl('https://example.com/a (1).png')).toBe(
            'url("https://example.com/a%20%281%29.png")',
        );
    });

    it('should reject unsupported URL schemes', () => {
        const unsafe = ['java', 'script:alert(1)'].join('');
        expect(toCssUrl(unsafe)).toBe(null);
        expect(domAttrs({image: unsafe})['data-image']).toBeUndefined();
    });
});
