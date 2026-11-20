import {describe, expect, it} from 'vitest';

import {safeImageUrl} from './url';

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
