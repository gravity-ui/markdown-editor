import MarkdownIt from 'markdown-it';
import {describe, expect, it} from 'vitest';

import {headerPlugin} from '../header/plugin';

import {
    headerImage,
    headerImageAttrs,
    headerImageDefaults,
    headerImageFromAttrs,
    headerImagePlugin,
    headerImageValues,
} from './index';

const md = new MarkdownIt().use(headerPlugin).use(headerImagePlugin);

const inHeader = (...blocks: string[]) => [':::header', ...blocks, ':::'].join('\n');

const render = (line: string) =>
    md
        .render(inHeader(line))
        .replace(/^<div [^>]*>\n/, '')
        .replace(/<\/div>\n$/, '');

const image = (src: string, alt = '', title?: string) =>
    `<img class="g-md-header-image-plugin" data-files-gallery-exclude="true" src="${src}" alt="${alt}"${title === undefined ? '' : ` title="${title}"`}>\n`;

const scriptUrl = ['javascript', 'alert(1)'].join(':');

describe('Header image Markdown', () => {
    it.each([
        ['https://example.org/image.jpg'],
        ['http://example.org/image.jpg'],
        ['HTTPS://EXAMPLE.ORG/IMAGE.JPG'],
        ['blob:https://example.org/8c3c2f'],
        ['/assets/image.jpg'],
        ['image.jpg'],
        ['./image.jpg?size=2#top'],
    ])('should render the address %j', (src) => {
        expect(render(`::header-image{src="${src}"}`)).toBe(image(src));
    });

    it.each([
        scriptUrl,
        'data:image/png;base64,AAAA',
        'vbscript:msgbox(1)',
        'file:///etc/passwd',
        '',
        '   ',
    ])('should render nothing for the address %j', (src) => {
        expect(render(`::header-image{src="${src}"}`)).toBe('');
    });

    it('should render nothing without an address', () => {
        expect(render('::header-image{alt="Team"}')).toBe('');
        expect(render('::header-image')).toBe('');
    });

    it('should render the alternative text and the title', () => {
        expect(render('::header-image{src="/team.jpg" alt="Team" title="Project team"}')).toBe(
            image('/team.jpg', 'Team', 'Project team'),
        );
    });

    it('should escape the quotes and the backslashes of the attributes', () => {
        expect(render('::header-image{src="/a.jpg" alt="Say \\"hi\\" \\\\ [ok] {x}"}')).toBe(
            image('/a.jpg', 'Say &quot;hi&quot; \\ [ok] {x}'),
        );
    });

    it('should escape the HTML of the attributes', () => {
        expect(render('::header-image{src="/a.jpg" alt="<b>&amp;</b>"}')).toBe(
            image('/a.jpg', '&lt;b&gt;&amp;&lt;/b&gt;'),
        );
    });

    it('should skip an unsupported attribute', () => {
        expect(render('::header-image{src="/a.jpg" onerror="alert(1)" width="10"}')).toBe(
            image('/a.jpg'),
        );
    });

    it('should drop an empty title', () => {
        expect(render('::header-image{src="/a.jpg" title=""}')).toBe(image('/a.jpg'));
    });

    it.each(['::header-image[Label]{src="/a.jpg"}', '::header-image(/a.jpg)'])(
        'should leave unsupported syntax as Markdown in %j',
        (markup) => {
            expect(
                md.parse(inHeader(markup), {}).some((token) => token.type === 'header-image'),
            ).toBe(false);
        },
    );

    it('should keep the source map of the directive', () => {
        const [, token] = md.parse(inHeader('::header-image{src="/a.jpg"}'), {});
        expect(token.type).toBe('header-image');
        expect(token.map).toEqual([1, 2]);
    });

    it('should render the image inside a header', () => {
        const html = md.render(inHeader('::header-image{src="/a.jpg" alt="Team"}', '', 'Text'));
        expect(html).toContain(image('/a.jpg', 'Team'));
        expect(html).toContain('<p>Text</p>');
    });

    it('should decode the address like a link address', () => {
        expect(render('::header-image{src="/a?x=1&amp;y=2"}')).toBe(image('/a?x=1&amp;y=2'));
        expect(render('::header-image{src="&#106;avascript:alert(1)"}')).toBe('');
    });

    it.each([
        ['outside a header', '::header-image{src="/a.jpg"}\n\nText'],
        ['after the text of a header', inHeader('Text', '', '::header-image{src="/a.jpg"}')],
        [
            'after another image',
            inHeader('::header-image{src="/a.jpg"}', '::header-image{src="/b.jpg"}'),
        ],
    ])('should keep the image %s as text', (_place, markup) => {
        const tokens = md.parse(markup, {});
        expect(tokens.filter((token) => token.type === 'header-image').length).toBeLessThan(2);
        expect(md.render(markup)).toContain('::header-image');
    });
});

describe('Header image attributes', () => {
    it('should read the attributes of the rendered element', () => {
        const attrs = headerImageAttrs({src: '/a.jpg', alt: 'Team', title: 'Title'});
        expect(headerImageFromAttrs((name) => attrs[name])).toEqual({
            src: '/a.jpg',
            alt: 'Team',
            title: 'Title',
        });
    });

    it('should use the defaults for unsupported values', () => {
        expect(headerImage({src: scriptUrl, alt: 1, title: ''})).toEqual(headerImageDefaults);
    });

    it('should list only the values that differ from the defaults', () => {
        expect(headerImageValues(headerImage({src: '/a.jpg'}))).toEqual({src: '/a.jpg'});
        expect(headerImageValues(headerImage({src: '/a.jpg', alt: 'A', title: 'T'}))).toEqual({
            src: '/a.jpg',
            alt: 'A',
            title: 'T',
        });
    });
});
