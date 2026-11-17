import MarkdownIt from 'markdown-it';
import {describe, expect, it} from 'vitest';

import {inlineCode} from '../src/extension-pages/markdown.mjs';

const md = new MarkdownIt();

describe('inlineCode', () => {
    it.each([
        ['sampleRule', '`sampleRule`'],
        ['/^```$/', '````/^```$/````'],
        ['`sample`', '`` `sample` ``'],
    ])('should render %s as a code span with the same text', (text, expected) => {
        const [inline] = md.parseInline(inlineCode(text), {});

        expect(inlineCode(text)).toBe(expected);
        expect(inline.children.map(({type, content}) => [type, content])).toEqual([
            ['code_inline', text],
        ]);
    });
});
