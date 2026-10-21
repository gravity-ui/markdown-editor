import MarkdownIt from 'markdown-it';
import {describe, expect, it} from 'vitest';

import spoiler from './spoiler';

const md = new MarkdownIt().use(spoiler);

const hidden = (html: string) =>
    `<span class="yfm-spoiler"><span class="yfm-spoiler__content">${html}</span></span>`;

describe('spoiler markdown-it plugin', () => {
    it('should render spoiler', () => {
        expect(md.renderInline(':spoiler[text]')).toBe(hidden('text'));
    });

    it('should render inline markup inside spoiler', () => {
        expect(md.renderInline(':spoiler[**a** _b_ `c]` [d](https://example.com)]')).toBe(
            hidden(
                '<strong>a</strong> <em>b</em> <code>c]</code> <a href="https://example.com">d</a>',
            ),
        );
    });

    it('should render several spoilers', () => {
        expect(md.renderInline(':spoiler[a] b :spoiler[c]')).toBe(
            `${hidden('a')} b ${hidden('c')}`,
        );
    });

    it('should unescape brackets and backslashes', () => {
        expect(md.renderInline(':spoiler[a \\] \\\\]')).toBe(hidden('a ] \\'));
    });

    it('should render line break inside spoiler', () => {
        expect(md.renderInline(':spoiler[a\\\nb]')).toBe(hidden('a<br>\nb'));
    });

    it('should not pair emphasis across spoiler bounds', () => {
        expect(md.renderInline('**a :spoiler[b** c]')).toBe(`**a ${hidden('b** c')}`);
    });

    it('should render text after spoiler as markdown', () => {
        expect(md.renderInline(':spoiler[a](*b*)')).toBe(`${hidden('a')}(<em>b</em>)`);
    });

    it.each([':spoiler[]', ':spoiler text]', '\\:spoiler[text]', ':spoiler\\[text\\]'])(
        'should keep %s as text',
        (markup) => {
            expect(md.renderInline(markup)).not.toContain('yfm-spoiler');
        },
    );
});
