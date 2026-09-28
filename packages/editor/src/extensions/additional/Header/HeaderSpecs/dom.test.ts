import {describe, expect, it} from 'vitest';

import {normalizeHeaderAttrs} from './attrs';
import {headerDomAttrs, headerHtml, toCssUrl} from './dom';

const html = (patch: Record<string, unknown>) =>
    headerHtml(normalizeHeaderAttrs(patch), 'Заголовок', (value) => value);

const domAttrs = (patch: Record<string, unknown>) => headerDomAttrs(normalizeHeaderAttrs(patch));

describe('header dom', () => {
    it('should draw shapes of the background layer', () => {
        expect(html({bg: 'shapes'})).toContain('g-md-header__shape');
    });

    it('should hide shapes under an image', () => {
        expect(html({bg: 'shapes', image: 'https://example.com/hero.png'})).not.toContain(
            'g-md-header__shape',
        );
    });

    it('should pass the image to the style property', () => {
        const attrs = domAttrs({image: 'https://example.com/hero.png'});

        expect(attrs['data-image']).toBe('https://example.com/hero.png');
        expect(attrs.style).toBe('--g-md-header-image:url("https://example.com/hero.png")');
    });

    it('should drop an image with an unsupported scheme', () => {
        expect(toCssUrl('javascript:alert(1)')).toBe(null);
        expect(domAttrs({image: 'javascript:alert(1)'})['data-image']).toBeUndefined();
    });
});
