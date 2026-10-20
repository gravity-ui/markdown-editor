import {afterEach, describe, expect, it, vi} from 'vitest';

import {getMediaType, normalizeMimeType} from '../media-type';

describe('normalizeMimeType', () => {
    it.each([
        [undefined, undefined],
        [null, undefined],
        ['', undefined],
        [' ; charset=utf-8', undefined],
        [' Image/SVG+XML ; charset=utf-8', 'image/svg+xml'],
        ['video/mp4', 'video/mp4'],
    ])('should normalize %j to %j', (value, expected) => {
        expect(normalizeMimeType(value)).toBe(expected);
    });
});

describe('getMediaType', () => {
    afterEach(() => vi.unstubAllGlobals());

    it.each([
        ['signed image', '/photo.PNG?token=123#preview', undefined, 'image'],
        ['relative video', 'clip.WEBM?download=1', undefined, 'video'],
        ['query extension', '/download?name=photo.png', undefined, 'file'],
        ['hash extension', '/download#photo.png', undefined, 'file'],
        ['dotless path', '/png', undefined, 'file'],
        ['directory extension', '/photo.png/download', undefined, 'file'],
        ['SVG MIME', '/download', 'image/svg+xml', 'image'],
        ['MIME priority', '/photo.png', 'video/mp4', 'video'],
        ['unknown MIME fallback', '/photo.jpg', 'application/octet-stream', 'image'],
        ['unknown format', '/document.pdf', 'application/pdf', 'file'],
        ['data MIME', 'data:application/octet-stream;base64,abc', 'image/png', 'image'],
        ['data payload extension', ' data:application/octet-stream,photo.png', undefined, 'file'],
        ['invalid URL', 'https://[invalid/photo.png', undefined, 'file'],
    ])('should classify %s', (_name, url, mimeType, expected) => {
        expect(getMediaType({url, mimeType, baseURI: 'https://example.com/files/'})).toBe(expected);
    });

    it.each([
        ['MacIntel', 'video'],
        ['Linux x86_64', 'file'],
    ])('should classify QuickTime on %s at call time', (platform, expected) => {
        vi.stubGlobal('navigator', {platform});

        expect(getMediaType({url: '/clip.mov', baseURI: 'https://example.com/'})).toBe(expected);
        expect(
            getMediaType({
                url: '/download',
                mimeType: 'video/quicktime',
                baseURI: 'https://example.com/',
            }),
        ).toBe(expected);
    });
});
