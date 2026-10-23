import {describe, expect, it} from 'vitest';

import {normalizeHeaderAttrs} from './attrs';
import {headerDomAttrs, headerHtmlOpen, toCssUrl} from './dom';

const image = 'https://example.com/hero.png';
const domAttrs = (patch: Record<string, unknown>) => headerDomAttrs(normalizeHeaderAttrs(patch));
const open = (patch: Record<string, unknown>) =>
    headerHtmlOpen(normalizeHeaderAttrs(patch), (value) => value);

describe('header dom', () => {
    it('should expose the background and image settings through data attributes', () => {
        const attrs = domAttrs({
            bg: 'image',
            image,
            layout: 'object',
            fit: 'whole',
            focus: 'right',
            fill: 'purple-light',
            fill2: 'green',
            decor: 'gradient',
            direction: 'down',
            edges: 'bleed',
            border: 'dotted',
        });
        expect(attrs).toMatchObject({
            'data-bg': 'image',
            'data-image': image,
            'data-layout': 'object',
            'data-fit': 'whole',
            'data-focus': 'right',
            'data-fill': 'purple-light',
            'data-fill2': 'green',
            'data-decor': 'gradient',
            'data-direction': 'down',
            'data-edges': 'bleed',
            'data-border': 'dotted',
        });
        expect(attrs.style).toContain(`--g-md-header-image:url("${image}")`);
    });

    it('should render a plain surface without parameters', () => {
        const html = open({});
        expect(html).toContain('data-bg="fill"');
        expect(html).toContain('data-fill="system"');
        expect(html).toContain('data-decor="none"');
        expect(html).toContain('data-text="system"');
        expect(html).not.toContain('style=');
        expect(html).not.toContain('g-md-header__shape');
    });

    it('should ignore the image address unless the background is an image', () => {
        const attrs = domAttrs({bg: 'fill', image});
        expect(attrs['data-image']).toBeUndefined();
        expect(attrs.style).toBeUndefined();
    });

    it.each(['shapes', 'mesh'])('should draw decor="%s" beneath the content', (decor) => {
        const html = open({decor});
        expect(html).toContain('g-md-header__shape');
        expect(html.indexOf('g-md-header__shape')).toBeLessThan(
            html.indexOf('g-md-header__content'),
        );
    });

    it('should draw shapes over an image too', () => {
        expect(open({bg: 'image', image, decor: 'shapes'})).toContain('g-md-header__shape');
    });

    it('should mark mesh spots with the fill they take', () => {
        const html = open({decor: 'mesh', shape: 'edges'});
        expect(html).toContain('data-tone="fill2"');
        expect(html).toContain('data-tone="fill"');
        expect(open({decor: 'shapes'})).not.toContain('data-tone');
    });

    it('should encode unsafe characters in CSS URLs', () => {
        expect(toCssUrl('https://example.com/a (1).png')).toBe(
            'url("https://example.com/a%20%281%29.png")',
        );
    });

    it('should reject unsupported URL schemes', () => {
        const unsafe = ['java', 'script:alert(1)'].join('');
        expect(toCssUrl(unsafe)).toBe(null);
        expect(domAttrs({bg: 'image', image: unsafe})['data-image']).toBeUndefined();
    });
});
