import {describe, expect, it} from 'vitest';

import {normalizeHeaderAttrs} from './attrs';
import {headerDomAttrs, headerHtml, safeImageUrl, toCssUrl} from './dom';

describe('Header DOM', () => {
    it('should encode CSS URL delimiters and reject unsafe protocols and control characters', () => {
        expect(toCssUrl('https://example.com/a (1).png')).toBe(
            'url("https://example.com/a%20%281%29.png")',
        );
        for (const value of [
            ['javascript', 'alert(1)'].join(':'),
            'java\nscript:alert(1)',
            'data:image/svg+xml,test',
            'file:///tmp/test',
        ])
            expect(safeImageUrl(value)).toBeNull();
        expect(
            headerDomAttrs(normalizeHeaderAttrs({image: ['javascript', 'alert(1)'].join(':')}))
                .style,
        ).toBeUndefined();
    });
    it('should render shapes using sanitizer-compatible custom properties outside the theme', () => {
        const html = headerHtml(
            normalizeHeaderAttrs({shapes: 'scatter', image: '/bg.png', 'bg-image-theme': 'dark'}),
            'Title',
            (value) => value,
        );
        expect(html).toContain('--g-md-header-shape-size:');
        expect(html.indexOf('g-md-header__shape')).toBeLessThan(html.indexOf('g-root_theme_dark'));
    });
});
