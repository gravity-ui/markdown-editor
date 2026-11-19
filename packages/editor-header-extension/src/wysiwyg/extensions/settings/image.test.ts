import {describe, expect, it} from 'vitest';

import {imageFileError, imageName, uploadHint} from './image';

describe('Image settings helpers', () => {
    it.each([
        [{}, null],
        [{maxImageSize: 2 * 1024 * 1024}, 'Up to 2 MB'],
        [{imageTypes: ['image/png']}, 'PNG'],
        [
            {imageTypes: ['image/jpeg', 'image/gif', 'image/png'], maxImageSize: 1536 * 1024},
            'JPEG, GIF or PNG, up to 1.5 MB',
        ],
        [{imageTypes: ['image/svg+xml', 'image/webp']}, 'SVG or WEBP'],
        [{maxImageSize: 32 * 1024}, 'Up to 32 KB'],
        [{maxImageSize: 512}, 'Up to 512 B'],
    ])('should build the upload hint from %o', (limits, hint) => {
        expect(uploadHint(limits)).toBe(hint);
    });

    it.each([
        ['/assets/team.png', 'team.png'],
        ['https://example.org/a/team.png?size=2#top', 'team.png'],
        ['/assets/team%20photo.png', 'team photo.png'],
        ['/assets/100%25.png', '100%.png'],
        ['/assets/bad%E0%A4%A.png', 'bad%E0%A4%A.png'],
        ['https://example.org/', 'https://example.org/'],
        ['https://example.org', 'example.org'],
    ])('should name the image %j as %j', (url, name) => {
        expect(imageName(url)).toBe(name);
    });

    const png = new File(['image'], 'a.png', {type: 'image/png'});
    const svg = new File(['image'], 'a.svg', {type: 'image/svg+xml'});
    const text = new File(['text'], 'a.txt', {type: 'text/plain'});
    const big = new File(['x'.repeat(2 * 1024 * 1024)], 'a.png', {type: 'image/png'});

    it.each([
        [png, {}, null],
        [svg, {}, null],
        [text, {}, 'Unsupported file format'],
        [svg, {imageTypes: ['image/jpeg', 'image/png']}, 'Unsupported file format'],
        [png, {imageTypes: ['image/jpeg', 'image/png']}, null],
        [png, {maxImageSize: 5}, null],
        [big, {maxImageSize: 1024 * 1024}, 'The file is larger than 1 MB'],
        [big, {maxImageSize: 1536 * 1024}, 'The file is larger than 1.5 MB'],
    ])('should check %o against %o', (image, limits, error) => {
        expect(imageFileError(image, limits)).toBe(error);
    });
});
