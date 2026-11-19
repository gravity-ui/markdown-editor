import MarkdownIt from 'markdown-it';
import {describe, expect, it} from 'vitest';

import {escapeQuoted} from './escape';

const md = new MarkdownIt();

const parseTitle = (title: string) =>
    md.parseInline(`[a](b "${escapeQuoted(title)}")`, {})[0].children?.[0].attrGet('title');

describe('escapeQuoted', () => {
    it.each(['a "b" c', 'a \\ b \\" c', 'R&D', 'a &amp; b', '&copy; &#65; &#x41;', 'AT&T; &a;'])(
        'should keep %j in a link title',
        (title) => {
            expect(parseTitle(title)).toBe(title);
        },
    );

    it('should leave an ampersand outside a character reference', () => {
        expect(escapeQuoted('R&D ?a=1&b=2')).toBe('R&D ?a=1&b=2');
    });
});
