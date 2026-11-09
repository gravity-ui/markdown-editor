import MarkdownIt from 'markdown-it';
import {describe, expect, it} from 'vitest';

import {
    headerContentAttrsFromClassName,
    headerPlugin,
    headerTitleAttrsFromClassName,
    headerTitleClassNames,
    normalizeHeaderTextAttrs,
    normalizeHeaderTitleAttrs,
} from './index';

const md = new MarkdownIt().use(headerPlugin);

const root =
    '<div class="g-md-header-plugin g-md-header-plugin_height_s g-md-header-plugin_width_m">';
const title = (size = '2', color = 'auto', modifiers = '') =>
    `<div class="g-md-header-plugin__title g-md-header-plugin__title_size_${size} g-md-header-plugin__title_color_${color}${modifiers}">`;
const content = '<div class="g-md-header-plugin__content">';

describe('Header text', () => {
    it.each([
        [
            ':::header\n\n:::header-title\nTeam portal\n:::\n\n:::header-content\nFirst\n\nSecond\n:::\n\n:::',
            `${root}\n` +
                `${title()}\n<p>Team portal</p>\n</div>\n` +
                `${content}\n<p>First</p>\n<p>Second</p>\n</div>\n` +
                '</div>\n',
        ],
        [
            ':::header{title="false" description="false"}\n:::header-title{size="1" color="red"}\nTitle\n:::\n:::header-content\nText\n:::\n:::',
            `${root}\n` +
                `${title('1', 'red', ' g-md-header-plugin__title_hidden')}\n<p>Title</p>\n</div>\n` +
                '<div class="g-md-header-plugin__content g-md-header-plugin__content_hidden">\n<p>Text</p>\n</div>\n' +
                '</div>\n',
        ],
        [
            ':::header\n:::header-content\nOnly **description**\n:::\n:::',
            `${root}\n${content}\n<p>Only <strong>description</strong></p>\n</div>\n</div>\n`,
        ],
        [
            ':::header\n:::header-title\n:::\n:::header-content\n:::\n:::',
            `${root}\n${title()}</div>\n${content}</div>\n</div>\n`,
        ],
        [
            '> :::header\n> :::header-title\n> Quoted\n> :::\n> :::',
            `<blockquote>\n${root}\n${title()}\n<p>Quoted</p>\n</div>\n</div>\n</blockquote>\n`,
        ],
        [
            ':::header\n:::header-title\nTitle\n:::\nText\n\n:::header-content\nDescription\n:::\n:::',
            `${root}\n` +
                `${title()}\n<p>Title</p>\n</div>\n` +
                '<p>Text</p>\n' +
                `${content}\n<p>Description</p>\n</div>\n` +
                '</div>\n',
        ],
        [
            ':::header\n:::header-title\n:::header\n:::\n:::\n:::',
            `${root}\n${title()}\n${root}</div>\n</div>\n</div>\n`,
        ],
    ])('should render title and description for %j', (markup, html) => {
        expect(md.render(markup)).toBe(html);
    });

    it.each([
        [':::header\n:::header-title\nA\n:::\n:::header-title\nB\n:::\n:::', ':::header-title\nB\n:::'],
        [
            ':::header\n:::header-content\nA\n:::\n:::header-title\nB\n:::\n:::',
            ':::header-title\nB\n:::',
        ],
        [':::header\nText\n\n:::header-title\nB\n:::\n:::', ':::header-title\nB\n:::'],
        [
            ':::header\n:::header-content\nA\n:::\n:::header-content\nB\n:::\n:::',
            ':::header-content\nB\n:::',
        ],
        [':::header\n:::header-title[Label]\nA\n:::\n:::', ':::header-title[Label]\nA\n:::'],
        [':::header\n> :::header-title\n> A\n> :::\n:::', ':::header-title\nA\n:::'],
    ])('should keep a misplaced slot as text in %j', (markup, text) => {
        expect(md.render(markup)).toContain(`<p>${text}</p>`);
    });

    it('should not recognize text slots outside a header', () => {
        expect(md.render(':::header-title\nTitle\n:::\n\n:::header-content\nText\n:::')).toBe(
            '<p>:::header-title\nTitle\n:::</p>\n<p>:::header-content\nText\n:::</p>\n',
        );
    });

    it.each([
        [':::header\n:::header-title{size="7"}\nA\n:::\n:::', title()],
        [':::header\n:::header-title{color="pink"}\nA\n:::\n:::', title()],
        [':::header\n:::header-title{align="left" size="3"}\nA\n:::\n:::', title('3')],
        [':::header\n:::header-content{size="1"}\nA\n:::\n:::', content],
        [':::header{title="no"}\n:::header-title\nA\n:::\n:::', title()],
    ])('should skip unsupported attributes and values in %j', (markup, opening) => {
        expect(md.render(markup)).toContain(`${opening}\n<p>A</p>`);
    });

    it('should pass slot attributes in the token meta', () => {
        const tokens = md.parse(
            ':::header{description="false"}\n:::header-title{size="4" color="blue"}\nA\n:::\n:::header-content\nB\n:::\n:::',
            {},
        );
        const meta = (type: string) => tokens.find((token) => token.type === type)?.meta;
        expect(meta('header_open')).toEqual({height: 's', width: 'm'});
        expect(meta('header-title_open')).toEqual({size: '4', color: 'blue', hidden: false});
        expect(meta('header-content_open')).toEqual({hidden: true});
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
        expect(normalizeHeaderTextAttrs({title: 'false', description: 'true'})).toEqual({
            title: false,
            description: true,
        });
        expect(normalizeHeaderTextAttrs({title: 'no'})).toEqual({title: true, description: true});
    });

    it('should read slot attributes back from class names', () => {
        const attrs = {size: '5', color: 'violet', hidden: true};
        expect(headerTitleAttrsFromClassName(headerTitleClassNames(attrs))).toEqual(attrs);
        expect(headerTitleAttrsFromClassName('g-md-header-plugin__title')).toEqual({
            size: '2',
            color: 'auto',
            hidden: false,
        });
        expect(
            headerContentAttrsFromClassName(
                'g-md-header-plugin__content g-md-header-plugin__content_hidden',
            ),
        ).toEqual({hidden: true});
    });
});
