import MarkdownIt from 'markdown-it';
import {describe, expect, it} from 'vitest';

import {
    headerPlugin,
    headerTextMarkupAttrs,
    isHeaderSource,
    normalizeHeaderTextAttrs,
    normalizeHeaderTitleAttrs,
    serializeHeaderTitleOpening,
} from './index';

const md = new MarkdownIt().use(headerPlugin);

const source = (markup: string) => `<pre><code>${md.utils.escapeHtml(markup)}</code></pre>\n`;

describe('Header text', () => {
    it.each([
        [
            ':::header\n\n:::header-title\nTeam portal\n:::\n\n:::header-content\nFirst\n\nSecond\n:::\n\n:::',
            '<div class="g-md-header" data-height="s" data-width="m">\n' +
                '<div class="g-md-header__title" data-size="2">\n<p>Team portal</p>\n</div>\n' +
                '<div class="g-md-header__content">\n<p>First</p>\n<p>Second</p>\n</div>\n' +
                '</div>\n',
        ],
        [
            ':::header{title="false" description="false"}\n:::header-title{size="1" color="red"}\nTitle\n:::\n:::',
            '<div class="g-md-header" data-height="s" data-width="m" data-title="false" data-description="false">\n' +
                '<div class="g-md-header__title" data-size="1" data-color="red">\n<p>Title</p>\n</div>\n' +
                '</div>\n',
        ],
        [
            ':::header\n:::header-content\nOnly **description**\n:::\n:::',
            '<div class="g-md-header" data-height="s" data-width="m">\n' +
                '<div class="g-md-header__content">\n<p>Only <strong>description</strong></p>\n</div>\n' +
                '</div>\n',
        ],
        [
            ':::header\n:::header-title\n:::\n:::header-content\n:::\n:::',
            '<div class="g-md-header" data-height="s" data-width="m">\n' +
                '<div class="g-md-header__title" data-size="2"></div>\n' +
                '<div class="g-md-header__content"></div>\n' +
                '</div>\n',
        ],
        [
            '> :::header\n> :::header-title\n> Quoted\n> :::\n> :::',
            '<blockquote>\n<div class="g-md-header" data-height="s" data-width="m">\n' +
                '<div class="g-md-header__title" data-size="2">\n<p>Quoted</p>\n</div>\n' +
                '</div>\n</blockquote>\n',
        ],
    ])('should render title and description for %j', (markup, html) => {
        expect(md.render(markup)).toBe(html);
        expect(isHeaderSource(markup)).toBe(false);
    });

    it.each([
        ':::header\n:::header-title\nA\n:::\n:::header-title\nB\n:::\n:::',
        ':::header\n:::header-content\nA\n:::\n:::header-title\nB\n:::\n:::',
        ':::header\n:::header-title{size="7"}\nA\n:::\n:::',
        ':::header\n:::header-title{color="pink"}\nA\n:::\n:::',
        ':::header\n:::header-title{align="left"}\nA\n:::\n:::',
        ':::header\n:::header-title[Label]\nA\n:::\n:::',
        ':::header\n:::header-content{size="1"}\nA\n:::\n:::',
        ':::header\n:::header-title\nA\n:::\nText after slots\n:::',
        ':::header{title="no"}\n:::',
        ':::header{description="0"}\n:::',
    ])('should keep a header with an unsupported body as source for %j', (markup) => {
        expect(md.render(markup)).toBe(source(markup));
        expect(isHeaderSource(markup)).toBe(true);
    });

    it('should not recognize text slots outside a header', () => {
        expect(md.render(':::header-title\nTitle\n:::\n\n:::header-content\nText\n:::')).toBe(
            '<p>:::header-title\nTitle\n:::</p>\n<p>:::header-content\nText\n:::</p>\n',
        );
    });

    it('should keep a header nested in a slot as source', () => {
        expect(md.render(':::header\n:::header-title\n:::header\n:::\n:::\n:::')).toBe(
            '<div class="g-md-header" data-height="s" data-width="m">\n' +
                '<div class="g-md-header__title" data-size="2">\n' +
                source(':::header\n:::') +
                '</div>\n</div>\n',
        );
    });

    it('should normalize text attributes', () => {
        expect(normalizeHeaderTitleAttrs({})).toEqual({size: '2', color: 'auto'});
        expect(normalizeHeaderTitleAttrs({size: 4, color: 'blue'})).toEqual({
            size: '4',
            color: 'blue',
        });
        expect(normalizeHeaderTitleAttrs({size: '9', color: 'pink'})).toEqual({
            size: '2',
            color: 'auto',
        });
        expect(normalizeHeaderTextAttrs({title: 'false', description: true})).toEqual({
            title: false,
            description: true,
        });
        expect(headerTextMarkupAttrs({title: true, description: false})).toEqual({
            title: undefined,
            description: 'false',
        });
    });

    it('should write only title attributes that differ from the defaults', () => {
        expect(serializeHeaderTitleOpening({size: '2', color: 'auto'})).toBe(':::header-title');
        expect(serializeHeaderTitleOpening({size: '3', color: 'auto'})).toBe(
            ':::header-title{size="3"}',
        );
        expect(serializeHeaderTitleOpening({size: '2', color: 'green'})).toBe(
            ':::header-title{color="green"}',
        );
    });
});
