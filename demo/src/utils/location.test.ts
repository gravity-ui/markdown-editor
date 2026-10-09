import {Buffer} from 'node:buffer';

import {compressToEncodedURIComponent} from 'lz-string';
import {afterEach, beforeEach, describe, expect, it, vi} from 'vitest';

import {getInitialMd} from './getInitialMd';
import {parseLocation, updateLocation} from './location';

const html =
    '{% html %}\n' + '<div class="example">Привет 🌍</div>\n'.repeat(200) + '{% endhtml %}';
const samples = ['', 'a', '# Heading\n\nSome **bold** text.', 'Привет 世界 🌍', '\0\n\r\t', html];

describe('demo URL markup', () => {
    const state = {story: 'playground'};
    let location: URL;
    let replaceState: ReturnType<typeof vi.fn>;

    beforeEach(() => {
        location = new URL(
            'https://example.com/?path=/story/playground--story&args=mobile:false#preview',
        );
        replaceState = vi.fn((_state, _title, url) => {
            location = new URL(url);
        });
        vi.stubGlobal('parent', {
            get location() {
                return location;
            },
            history: {state, replaceState},
        });
        vi.spyOn(console, 'error').mockImplementation(() => {});
    });

    afterEach(() => {
        vi.restoreAllMocks();
        vi.unstubAllGlobals();
    });

    it.each(samples)('should restore markup after updating the URL (%#)', (markup) => {
        updateLocation(markup);
        expect(parseLocation()).toBe(markup);
        expect(console.error).not.toHaveBeenCalled();
    });

    it.each(samples)('should read an existing UTF-8 Base64 link (%#)', (markup) => {
        location.searchParams.set('markup', Buffer.from(markup).toString('base64'));
        expect(parseLocation()).toBe(markup);
    });

    it('should compress a long HTML block without changing its content', () => {
        updateLocation(html);
        const encoded = location.searchParams.get('markup');
        expect(encoded).toMatch(/^lz:/);
        expect(location.search.length).toBeLessThan(
            Buffer.from(html).toString('base64').length / 2,
        );
        expect(parseLocation()).toBe(html);
    });

    it('should keep Base64 when compression would make the URL longer', () => {
        updateLocation('a');
        expect(location.searchParams.get('markup')).toBe('YQ==');
    });

    it('should preserve the story, controls, fragment and history state', () => {
        updateLocation(html);
        expect(location.searchParams.get('path')).toBe('/story/playground--story');
        expect(location.searchParams.get('args')).toBe('mobile:false');
        expect(location.hash).toBe('#preview');
        expect(replaceState).toHaveBeenCalledWith(state, '', location.toString());
    });

    it('should read a compressed Unicode link', () => {
        location.searchParams.set(
            'markup',
            'lz:' + compressToEncodedURIComponent('Привет 世界 🌍'),
        );
        expect(parseLocation()).toBe('Привет 世界 🌍');
    });

    it('should preserve empty markup when reopening the playground', () => {
        updateLocation('');
        expect(getInitialMd()).toBe('');
    });

    it('should return null when markup is absent', () => {
        expect(parseLocation()).toBeNull();
    });

    it.each(['%', 'lz:', 'lz:!'])('should ignore an invalid markup value (%s)', (value) => {
        location.searchParams.set('markup', value);
        expect(parseLocation()).toBeNull();
    });

    it('should tolerate inaccessible parent location', () => {
        vi.stubGlobal('parent', {
            get location() {
                throw new Error('Access denied');
            },
        });
        expect(parseLocation()).toBeNull();
        expect(() => updateLocation(html)).not.toThrow();
        expect(console.error).toHaveBeenCalledTimes(2);
    });
});
