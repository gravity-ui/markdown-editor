import MarkdownIt from 'markdown-it';
import {describe, expect, it} from 'vitest';

import {
    headerImage,
    headerImageAttrs,
    headerImageDefaults,
    headerImageFromAttrs,
    headerImagePlugin,
    headerImageTokenName,
    headerImageValues,
    headerPlugin,
} from '../index';

const md = new MarkdownIt().use(headerPlugin).use(headerImagePlugin);

const inHeader = (...blocks: string[]) => [':::header', ...blocks, ':::'].join('\n\n');

const render = (line: string) =>
    md
        .render(inHeader(line))
        .replace(/^<div [^>]*>\n/, '')
        .replace(/<\/div>\n$/, '');

const image = (src: string, alt = '', title?: string) =>
    `<img class="g-md-header-image-plugin" data-files-gallery-exclude="true" src="${src}" alt="${alt}"${title === undefined ? '' : ` title="${title}"`}>\n`;

const imageTokens = (markup: string) =>
    md.parse(markup, {}).filter((token) => token.type === headerImageTokenName);

const scriptUrl = ['javascript', 'alert(1)'].join(':');

describe('Header image Markdown', () => {
    it.each([
        'https://example.org/image.jpg',
        'http://example.org/image.jpg',
        'HTTPS://EXAMPLE.ORG/IMAGE.JPG',
        'blob:https://example.org/8c3c2f',
        '/assets/image.jpg',
        'image.jpg',
        './image.jpg?size=2#top',
    ])('should render the address %j', (src) => {
        expect(render(`::header-image{src="${src}"}`)).toBe(image(src));
    });

    it.each([
        scriptUrl,
        scriptUrl.toUpperCase(),
        ` ${scriptUrl}`,
        '&#106;avascript:alert(1)',
        'data:image/png;base64,AAAA',
        'vbscript:msgbox(1)',
        'file:///etc/passwd',
        '',
        '   ',
    ])('should render nothing for the address %j', (src) => {
        expect(render(`::header-image{src="${src}"}`)).toBe('');
    });

    it.each(['::header-image{alt="Team"}', '::header-image'])(
        'should render nothing without an address in %j',
        (markup) => {
            expect(render(markup)).toBe('');
            expect(imageTokens(inHeader(markup))).toHaveLength(1);
        },
    );

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

    it.each([
        '::header-image{src="/a.jpg" onerror="alert(1)" width="10"}',
        '::header-image{src="/a.jpg" title=""}',
        '::header-image{src="/a.jpg" .custom #id}',
    ])('should skip an unsupported or empty attribute in %j', (markup) => {
        expect(render(markup)).toBe(image('/a.jpg'));
    });

    it.each(['::header-image[Label]{src="/a.jpg"}', '::header-image(/a.jpg)'])(
        'should leave unsupported syntax as Markdown in %j',
        (markup) => {
            expect(imageTokens(inHeader(markup))).toHaveLength(0);
        },
    );

    it('should keep the source map of the directive', () => {
        const [, token] = md.parse(inHeader('::header-image{src="/a.jpg"}'), {});
        expect(token.type).toBe(headerImageTokenName);
        expect(token.map).toEqual([2, 3]);
    });

    it.each([
        ['before the text', inHeader('::header-image{src="/a.jpg" alt="Team"}', 'Text')],
        ['after the text', inHeader('Text', '::header-image{src="/a.jpg" alt="Team"}')],
    ])('should keep the image %s in the order of the source', (_place, markup) => {
        const html = md.render(markup);
        expect(html).toContain(image('/a.jpg', 'Team'));
        expect(html.indexOf('<img') < html.indexOf('<p>Text</p>')).toBe(
            markup.indexOf('::header-image') < markup.indexOf('Text'),
        );
    });

    it.each([
        inHeader('::header-image{src="/a.jpg"}', 'Text', '::header-image{src="/b.jpg"}'),
        inHeader('::header-image{src="/a.jpg"}', '::header-image{src="/b.jpg"}'),
        inHeader('::header-image', '::header-image{src="/b.jpg"}'),
    ])('should keep a second image of the same banner as text in %j', (markup) => {
        expect(imageTokens(markup)).toHaveLength(1);
        expect(md.render(markup)).toContain('<p>::header-image{src=&quot;/b.jpg&quot;}</p>');
    });

    it.each([
        [
            'in two banners',
            [inHeader('::header-image{src="/a.jpg"}'), inHeader('::header-image{src="/b.jpg"}')],
        ],
        [
            'in a nested banner and in its parent',
            [inHeader(inHeader('::header-image{src="/a.jpg"}'), '::header-image{src="/b.jpg"}')],
        ],
        [
            'in a quote of a banner and in the banner',
            [inHeader('> ::header-image{src="/a.jpg"}', '::header-image{src="/b.jpg"}')],
        ],
        [
            'outside a banner',
            ['::header-image{src="/a.jpg"}', '::header-image{src="/b.jpg"}', 'Text'],
        ],
    ])('should parse the images %s', (_place, blocks) => {
        const markup = blocks.join('\n\n');
        expect(imageTokens(markup).map((token) => token.attrGet('src'))).toEqual([
            '/a.jpg',
            '/b.jpg',
        ]);
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

    it.each([
        [{src: '/a.jpg'}, {src: '/a.jpg'}],
        [
            {src: '/a.jpg', alt: 'A', title: 'T'},
            {src: '/a.jpg', alt: 'A', title: 'T'},
        ],
        [{alt: 'A'}, {alt: 'A'}],
        [{}, {}],
    ])('should list only the values other than the defaults of %j', (attrs, values) => {
        expect(headerImageValues(headerImage(attrs))).toEqual(values);
    });
});
