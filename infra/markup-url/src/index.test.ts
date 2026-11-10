import {compressToEncodedURIComponent} from 'lz-string';
import {describe, expect, it} from 'vitest';

import {decodeMarkup, encodeMarkup} from './index';

const html =
    '{% html %}\n' + '<div class="example">Привет 🌍</div>\n'.repeat(200) + '{% endhtml %}';
const samples = ['', 'a', '# Heading\n\nSome **bold** text.', 'Привет 世界 🌍', '\0\n\r\t', html];

const toBase64 = (markup: string) => btoa(String.fromCharCode(...new TextEncoder().encode(markup)));

describe('markup url', () => {
    it.each(samples)('should restore markup after encoding (%#)', (markup) => {
        expect(decodeMarkup(encodeMarkup(markup))).toBe(markup);
    });

    it.each(samples)('should decode a value without the compression prefix (%#)', (markup) => {
        expect(decodeMarkup(toBase64(markup))).toBe(markup);
    });

    it('should decode a compressed value', () => {
        const markup = 'Привет 世界 🌍';

        expect(decodeMarkup('lz:' + compressToEncodedURIComponent(markup))).toBe(markup);
    });

    it('should compress a long HTML block to less than half of Base64', () => {
        const encoded = encodeMarkup(html);

        expect(encoded).toMatch(/^lz:/);
        expect(encoded.length).toBeLessThan(toBase64(html).length / 2);
    });

    it('should keep Base64 when compression makes the value longer', () => {
        expect(encodeMarkup('a')).toBe('YQ==');
    });

    it.each(['%', 'lz:', 'lz:!'])('should return null for an undecodable value (%s)', (value) => {
        expect(decodeMarkup(value)).toBeNull();
    });
});
