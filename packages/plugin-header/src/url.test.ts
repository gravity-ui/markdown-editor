import {describe, expect, it} from 'vitest';

import {safeImageUrl, toCssUrl} from './url';

// Built at runtime for the `no-script-url` lint rule.
const scriptUrl = ['javascript', 'alert(1)'].join(':');

describe('safeImageUrl', () => {
    it.each([
        scriptUrl,
        scriptUrl.toUpperCase(),
        ` ${scriptUrl}`,
        'vbscript:msgbox(1)',
        'data:text/html,<script>alert(1)</script>',
        'data:image/svg+xml,<svg/>',
        'file:///etc/passwd',
        '',
        '   ',
    ])('should reject the image address %j', (url) => {
        expect(safeImageUrl(url)).toBeNull();
    });

    it.each(['java\tscript:alert(1)', 'https://example.com/\u0000.png', 'a\u007f.png'])(
        'should reject control characters in %j',
        (url) => {
            expect(safeImageUrl(url)).toBeNull();
        },
    );

    it.each([
        ['https://example.com/a.png', 'https://example.com/a.png'],
        ['HTTP://example.com/a.png', 'HTTP://example.com/a.png'],
        ['//example.com/a.png', '//example.com/a.png'],
        ['blob:https://example.com/0f8c', 'blob:https://example.com/0f8c'],
        ['  ./.files/a.png  ', './.files/a.png'],
        ['a.png?size=1:2', 'a.png?size=1:2'],
    ])('should accept the image address %j', (url, expected) => {
        expect(safeImageUrl(url)).toBe(expected);
    });
});

describe('toCssUrl', () => {
    it.each([scriptUrl, 'data:image/svg+xml,<svg/>', 'file:///etc/passwd', ''])(
        'should reject the image address %j',
        (url) => {
            expect(toCssUrl(url)).toBeNull();
        },
    );

    it.each([
        ['https://example.com/a.png', 'url("https://example.com/a.png")'],
        ['  ./.files/a (1).jpg  ', 'url("./.files/a%20%281%29.jpg")'],
        ['blob:https://example.com/0f8c', 'url("blob:https://example.com/0f8c")'],
    ])('should write the image address %j as %j', (url, css) => {
        expect(toCssUrl(url)).toBe(css);
    });

    it('should encode quotes, brackets, and comments in the CSS address', () => {
        const url = `a.png") ;background:url(${scriptUrl}) /*'\\`;
        expect(toCssUrl(url)).toBe(
            'url("a.png%22%29%20;background:url%28javascript:alert%281%29%29%20/%2A%27%5C")',
        );
    });
});
