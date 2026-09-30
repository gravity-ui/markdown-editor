import {describe, expect, it} from 'vitest';

import {normalizeHeaderAttrs} from './attrs';
import {headerDomAttrs, headerHtml, toCssUrl} from './dom';

const html = (patch: Record<string, unknown>) =>
    headerHtml(normalizeHeaderAttrs(patch), 'Заголовок', (value) => value);

const domAttrs = (patch: Record<string, unknown>) => headerDomAttrs(normalizeHeaderAttrs(patch));

const image = 'https://example.com/hero.png';

describe('header dom', () => {
    it('should draw shapes of the background layer', () => {
        expect(html({bg: 'shapes'})).toContain('g-md-header__shape');
    });

    it('should hide shapes under an image that takes the whole area', () => {
        expect(html({bg: 'shapes', image})).not.toContain('g-md-header__shape');
    });

    it('should keep shapes under a decor and under a tile', () => {
        expect(html({bg: 'shapes', image, layer: 'decor'})).toContain('g-md-header__shape');
        expect(html({bg: 'shapes', image, layer: 'tile'})).toContain('g-md-header__shape');
    });

    it('should pass the image to the style property', () => {
        const attrs = domAttrs({image});

        expect(attrs['data-image']).toBe(image);
        expect(attrs.style).toContain(`--g-md-header-image:url("${image}")`);
    });

    it('should pass the angle and the step to the style property', () => {
        expect(domAttrs({}).style).toBe('--g-md-header-angle:163deg;--g-md-header-step:32px');
        expect(domAttrs({angle: 110, step: 48}).style).toBe(
            '--g-md-header-angle:110deg;--g-md-header-step:48px',
        );
    });

    it('should mark the angle and the step on the element', () => {
        const attrs = domAttrs({angle: 110, step: 48});

        expect(attrs['data-angle']).toBe('110');
        expect(attrs['data-step']).toBe('48');
    });

    it('should mark the properties of the image only next to a usable link', () => {
        const withImage = domAttrs({image, layer: 'decor', fit: 'height', crop: 'right'});

        expect(withImage['data-layer']).toBe('decor');
        expect(withImage['data-fit']).toBe('height');
        expect(withImage['data-crop']).toBe('right');

        const withoutImage = domAttrs({layer: 'decor', fit: 'height', crop: 'right'});

        expect(withoutImage['data-layer']).toBeUndefined();
        expect(withoutImage['data-fit']).toBeUndefined();
        expect(withoutImage['data-crop']).toBeUndefined();
    });

    it('should drop an image with an unsupported scheme', () => {
        // eslint-disable-next-line no-script-url -- проверяется отсечение именно такой ссылки
        const unsafe = 'javascript:alert(1)';

        expect(toCssUrl(unsafe)).toBe(null);
        expect(domAttrs({image: unsafe})['data-image']).toBeUndefined();
        expect(domAttrs({image: unsafe, layer: 'tile'})['data-layer']).toBeUndefined();
    });
});
