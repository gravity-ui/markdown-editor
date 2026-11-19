import MarkdownIt from 'markdown-it';
import {describe, expect, it} from 'vitest';

import {buttonAttrs, buttonFromAttrs, buttonPlugin, headerPlugin} from '../index';

import {buttonDefaults, buttonTokenName, buttonViewColors} from './model';

const md = new MarkdownIt({html: true}).use(buttonPlugin);
const inlineTokens = (markup: string) => md.parseInline(markup, {})[0].children ?? [];
const openToken = (markup: string) =>
    inlineTokens(markup).find((token) => token.type === buttonTokenName);
const scriptUrl = ['javascript', 'alert(1)'].join(':');

describe('Button Markdown', () => {
    it('should preserve the model through HTML attributes', () => {
        const model = {
            ...buttonDefaults,
            href: '/help',
            title: 'Help',
            view: 'outline',
            color: 'blue',
            target: '_blank',
        } as const;
        const attrs = buttonAttrs(model);
        expect(buttonFromAttrs((name) => attrs[name as keyof typeof attrs])).toEqual(model);
    });
    it('should render a button with defaults', () => {
        expect(md.renderInline(':button[Read more](/page)')).toBe(
            '<a class="g-md-button-plugin g-md-button-plugin_view_action g-md-button-plugin_color_standard" href="/page" data-view="action" data-color="standard">Read more</a>',
        );
    });
    it('should keep the text around a button and between buttons', () => {
        expect(md.render('Press :button[One] or :button[Two] now')).toMatch(
            /^<p>Press <a [^>]+>One<\/a> or <a [^>]+>Two<\/a> now<\/p>\n$/,
        );
    });
    for (const [view, colors] of Object.entries(buttonViewColors)) {
        for (const color of colors) {
            it(`should pass the ${view} view with the ${color} color to the token`, () => {
                const token = openToken(`:button[Label]{view="${view}" color="${color}"}`);
                expect(token?.attrGet('data-view')).toBe(view);
                expect(token?.attrGet('data-color')).toBe(color);
            });
        }
    }
    it('should render the label as plain text', () => {
        const html = md.renderInline(':button[**Bold** & <b>tag</b> \\] [pair]]');
        expect(html).toContain('>**Bold** &amp; &lt;b&gt;tag&lt;/b&gt; ] [pair]</a>');
    });
    it.each([
        ':button',
        ':button[]',
        ':button[   ]',
        ':button[](/page)',
        ':button(/page)',
        ':button{view="flat"}',
    ])('should render an empty link for the empty button %j', (markup) => {
        expect(md.renderInline(`Before ${markup} After`)).toMatch(/^Before <a [^>]+><\/a> After$/);
    });
    it('should protect links opened in a new tab', () => {
        expect(md.renderInline(':button[Open](https://example.com){target="_blank"}')).toContain(
            'target="_blank" rel="noopener noreferrer"',
        );
    });
    it('should ignore unsupported attributes and normalize styles', () => {
        const token = openToken(
            ':button[Visible]{view="unknown" color="gray" target="popup" hidden="true" onclick="alert(1)"}',
        );
        expect(token?.attrGet('data-view')).toBe('action');
        expect(token?.attrGet('data-color')).toBe('standard');
        expect(token?.attrGet('hidden')).toBeNull();
        expect(token?.attrGet('onclick')).toBeNull();
        expect(token?.attrGet('target')).toBeNull();
    });
    it.each([false, true])(
        'should work with Header regardless of registration order: %s',
        (headerFirst) => {
            const parser = new MarkdownIt();
            parser
                .use(headerFirst ? headerPlugin : buttonPlugin)
                .use(headerFirst ? buttonPlugin : headerPlugin);
            const tokens = parser
                .parse(':::header\n:button[One] :button[Two]\n:::', {})
                .flatMap((token) => token.children ?? []);
            expect(tokens.filter((token) => token.type === buttonTokenName)).toHaveLength(2);
        },
    );
    it.each([
        '/page?a=1&b=2',
        '/image&copy;.png',
        '/page?a=1&copy=2&reg;=3',
        '/page?a=1&amp;b=2',
        '/image&#10;.png',
        '/a&lt;b&gt;c&quot;d',
        '/a\\(b\\)',
    ])('should read the address %s like the address of a link', (href) => {
        const link = inlineTokens(`[Open](${href})`).find((token) => token.type === 'link_open');
        expect(openToken(`:button[Open](${href})`)?.attrGet('href')).toBe(link?.attrGet('href'));
    });
    it.each(['"Title"', "'Title'", '(Title)', '"A \\"quoted\\" &amp; title"'])(
        'should read the title %s like the title of a link',
        (title) => {
            const link = inlineTokens(`[Open](/page ${title})`).find(
                (token) => token.type === 'link_open',
            );
            expect(openToken(`:button[Open](/page ${title})`)?.attrGet('title')).toBe(
                link?.attrGet('title'),
            );
        },
    );
    // Cases from the link tests xss.txt and normalize.txt of markdown-it 13.0.2:
    // https://github.com/markdown-it/markdown-it/tree/13.0.2/test/fixtures/markdown-it
    it.each([
        ['javascript', 'javascript'],
        [scriptUrl, null],
        [scriptUrl.toUpperCase(), null],
        ['vbscript:alert(1)', null],
        ['VBSCRIPT:alert(1)', null],
        ['file:///123', null],
        [
            '&#34;&#62;&#60;script&#62;alert&#40;&#34;xss&#34;&#41;&#60;/script&#62;',
            '%22%3E%3Cscript%3Ealert(%22xss%22)%3C/script%3E',
        ],
        ['&#74;avascript:alert(1)', null],
        ['&#x26;#74;avascript:alert(1)', '&#74;avascript:alert(1)'],
        ['\\&#74;avascript:alert(1)', '&#74;avascript:alert(1)'],
        ['javascript&#x3A;alert(1)', null],
        ['data:text/html;base64,PHNjcmlwdD5hbGVydCgnWFNTJyk8L3NjcmlwdD4K', null],
        [
            'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7',
            'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7',
        ],
        ['/javascript:link', '/javascript:link'],
        ['http://example.com/α%CE%B2γ%CE%B4', 'http://example.com/%CE%B1%CE%B2%CE%B3%CE%B4'],
        [
            'https://www.google.com/search?q=hello%2E%252Ehello',
            'https://www.google.com/search?q=hello%2E%252Ehello',
        ],
        ['http://xn--n3h.net/', 'http://xn--n3h.net/'],
        ['http://☃.net/', 'http://xn--n3h.net/'],
        ['http://xn--xn.com/', 'http://xn--xn.com/'],
        ['http://xn--γ.com/', 'http://xn--xn---emd.com/'],
        ['//☃.net/', '//xn--n3h.net/'],
        ['skype:γγγ', 'skype:%CE%B3%CE%B3%CE%B3'],
    ])('should read the address %s like the markdown-it link tests', (href, expected) => {
        expect(openToken(`:button[Open](${href})`)?.attrGet('href')).toBe(expected);
    });
    it('should ignore the address and the title in the attributes', () => {
        const token = openToken(':button[Open]{href="/page" title="Title"}');
        expect(token?.attrGet('href')).toBeNull();
        expect(token?.attrGet('title')).toBeNull();
    });
});
