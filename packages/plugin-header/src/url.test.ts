import {describe, expect, it} from 'vitest';

import {safeLinkUrl} from './url';

const scriptUrl = ['javascript', 'alert(1)'].join(':');

describe('safeLinkUrl', () => {
    it.each([
        scriptUrl,
        scriptUrl.toUpperCase(),
        ` ${scriptUrl}`,
        'vbscript:msgbox(1)',
        'data:text/html,<script>alert(1)</script>',
        'file:///etc/passwd',
        'java\tscript:alert(1)',
        '/page\u0000',
        '',
        '   ',
    ])('should reject the link address %j', (url) => {
        expect(safeLinkUrl(url)).toBeNull();
    });

    it.each([
        ['https://example.com/page', 'https://example.com/page'],
        ['  /page?a=1&b=2#part  ', '/page?a=1&b=2#part'],
        ['./page.md', './page.md'],
        ['#anchor', '#anchor'],
        ['mailto:team@example.com', 'mailto:team@example.com'],
        ['tel:+10000000000', 'tel:+10000000000'],
        ['page?next=javascript:1', 'page?next=javascript:1'],
    ])('should accept the link address %j', (url, expected) => {
        expect(safeLinkUrl(url)).toBe(expected);
    });
});
