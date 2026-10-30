import MarkdownIt from 'markdown-it';
import {describe, expect, it} from 'vitest';

import {configureLinkify} from './configureLinkify';

describe('configureLinkify', () => {
    it.each([
        ['example.com', undefined, 'http://example.com'],
        ['example.com', 'http', 'http://example.com'],
        ['user@example.com', 'https', 'mailto:user@example.com'],
        ['mailto:user@example.com', 'https', 'mailto:user@example.com'],
        ['http://example.com', 'https', 'http://example.com'],
        ['https://example.com', 'https', 'https://example.com'],
        ['//example.com', 'https', '//example.com'],
    ] satisfies [string, 'http' | 'https' | undefined, string][])(
        'should preserve the expected URL for %s with protocol %s',
        (text, defaultProtocol, expected) => {
            const md = new MarkdownIt().use(configureLinkify, {defaultProtocol});

            expect(md.linkify.match(text)?.[0].url).toBe(expected);
        },
    );

    it('should add custom domains and preserve default domains', () => {
        const md = new MarkdownIt().use(configureLinkify, {
            tlds: ['internal'],
            defaultProtocol: 'https',
        });

        expect(md.linkify.match('example.internal')?.[0].url).toBe('https://example.internal');
        expect(md.linkify.match('example.com')?.[0].url).toBe('https://example.com');
    });

    it('should leave URL normalization unchanged', () => {
        const md = new MarkdownIt().use(configureLinkify, {defaultProtocol: 'https'});

        expect(md.normalizeLink('example.com')).toBe('example.com');
    });
});
