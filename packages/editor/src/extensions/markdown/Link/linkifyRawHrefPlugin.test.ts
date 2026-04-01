import MarkdownIt from 'markdown-it';

import {linkifyRawHrefPlugin} from './linkifyRawHrefPlugin';

function mdWithPlugin() {
    const md = MarkdownIt({linkify: true});
    linkifyRawHrefPlugin(md);
    return md;
}

describe('linkifyRawHrefPlugin', () => {
    it('uses raw hostname in href for pasted text with trailing words', () => {
        const md = mdWithPlugin();
        expect(md.renderInline('ya.ru dasda')).toBe('<a href="ya.ru">ya.ru</a> dasda');
    });

    it('keeps explicit scheme in href', () => {
        const md = mdWithPlugin();
        expect(md.renderInline('https://ya.ru x')).toBe(
            '<a href="https://ya.ru">https://ya.ru</a> x',
        );
    });

    it('keeps mailto href for emails', () => {
        const md = mdWithPlugin();
        expect(md.renderInline('a@b.co rest')).toBe('<a href="mailto:a@b.co">a@b.co</a> rest');
    });
});
