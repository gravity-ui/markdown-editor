import {HeaderBackground, HeaderDefaults} from './const';
import {headerDomAttrs, toCssUrl} from './dom';

describe('Header image URLs', () => {
    it.each([
        'https://example.test/image.png',
        'http://example.test/image.png',
        '/assets/image.png',
        '../image.png',
        'blob:https://example.test/uploaded-image',
    ])('accepts %s', (url) => {
        expect(toCssUrl(url)).toBe(`url("${url}")`);
    });

    // eslint-disable-next-line no-script-url
    it.each(['javascript:alert(1)', 'data:text/html,body', 'file:///tmp/image.png', ''])(
        'rejects %s',
        (url) => {
            expect(toCssUrl(url)).toBeNull();
        },
    );

    it('encodes CSS delimiters without changing existing URL escapes', () => {
        expect(toCssUrl('/a%20b (1)\'"\\\n.png?size=2&crop=1')).toBe(
            'url("/a%20b%20%281%29%27%22%5C%0A.png?size=2&crop=1")',
        );
    });

    it('renders an uploaded object URL without an empty-image placeholder', () => {
        const attrs = headerDomAttrs({
            ...HeaderDefaults,
            bg: HeaderBackground.Image,
            image: 'blob:https://example.test/uploaded-image',
        });

        expect(attrs.style).toBe(
            '--g-md-header-image: url("blob:https://example.test/uploaded-image")',
        );
        expect(attrs['data-image-empty']).toBeUndefined();
    });
});
