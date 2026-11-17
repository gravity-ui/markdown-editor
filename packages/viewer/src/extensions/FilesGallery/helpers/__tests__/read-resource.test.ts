import {assert, describe, expect, it} from 'vitest';

import {readResource} from '../read-resource';

describe('readResource', () => {
    it.each([
        {
            source: 'YFM metadata without a URL extension',
            html: '<a class="yfm-file" href="/video" download="Video" type="video/mp4">Play</a>',
            expected: {url: '/video', type: 'video', name: 'Video', mimeType: 'video/mp4'},
        },
        {
            source: 'normalized SVG metadata',
            html: '<a class="yfm-file" href="/download" type=" Image/SVG+XML ; charset=utf-8">Open</a>',
            expected: {
                url: '/download',
                type: 'image',
                name: undefined,
                mimeType: 'image/svg+xml',
            },
        },
        {
            source: 'an img with a video URL',
            html: '<img src="/image.mp4">',
            expected: {url: '/image.mp4', type: 'image', name: undefined, mimeType: undefined},
        },
        {
            source: 'a data URI',
            html: '<a href="data:image/svg+xml,%3Csvg%2F%3E">Open</a>',
            expected: {
                url: 'data:image/svg+xml,%3Csvg%2F%3E',
                type: 'image',
                name: undefined,
                mimeType: 'image/svg+xml',
            },
        },
    ])('should read $source', ({html, expected}) => {
        const container = document.createElement('div');
        container.innerHTML = html;
        const element = container.firstElementChild;
        assert.isNotNull(element);

        expect(readResource(element)).toEqual({...expected, element});
    });
});
