import MarkdownIt from 'markdown-it';
import {describe, expect, it} from 'vitest';

import {directiveRawAttr, directiveRawAttrs} from './directive';

const md = new MarkdownIt();

describe('directiveRawAttr', () => {
    it.each([
        ['{href="/page"}', 'href', '/page'],
        ["{href='/page'}", 'href', '/page'],
        ['{href=page}', 'href', 'page'],
        ['{ view="flat"  href = "/page" }', 'href', '/page'],
        ['{.wide #top href="/page"}', 'href', '/page'],
        ['{href="/a&copy;b&amp;c&#10;d"}', 'href', '/a&copy;b&amp;c&#10;d'],
        ['{href="/a\\"b\\\\c"}', 'href', '/a"b\\c'],
        ['{title="href=\\"/wrong\\"" href="/right"}', 'href', '/right'],
        ['{title="a } b" href="/page"}', 'href', '/page'],
        ['{href="/one" href="/two"}', 'href', '/one'],
        ['{href=""}', 'href', ''],
        ['{view="flat"}', 'href', undefined],
        ['{}', 'href', undefined],
        ['', 'href', undefined],
    ])('should read %s for %s as %j', (markup, name, value) => {
        expect(directiveRawAttr(md, markup, name)).toBe(value);
    });
});

describe('directiveRawAttrs', () => {
    it.each([
        [
            '{src="/a&copy;b" alt="A&amp;B"}',
            {src: '/a&copy;b', alt: 'A&B'},
            {src: '/a&copy;b', alt: 'A&amp;B', title: undefined},
        ],
        [
            '{src="/one" src="/two"}',
            {src: ['/one', '/two']},
            {src: undefined, alt: undefined, title: undefined},
        ],
        ['{src=""}', {src: ''}, {src: '', alt: undefined, title: undefined}],
        ['{view="flat"}', {view: 'flat'}, {src: undefined, alt: undefined, title: undefined}],
        ['', {}, {src: undefined, alt: undefined, title: undefined}],
    ])('should read %s with the parsed attributes %j as %j', (markup, attrs, values) => {
        expect(directiveRawAttrs(md, markup, attrs, ['src', 'alt', 'title'])).toEqual(values);
    });
});
