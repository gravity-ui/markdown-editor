import MarkdownIt from 'markdown-it';
import {describe, expect, it} from 'vitest';

import {buttonAttrs, buttonFromAttrs, buttonPlugin, headerPlugin} from '../index';

import {buttonClassName, buttonDefaults, buttonViewColors} from './model';

const md = new MarkdownIt({html: true}).use(buttonPlugin);
const inlineTokens = (markup: string) => md.parseInline(markup, {})[0].children ?? [];
const openToken = (markup: string) => inlineTokens(markup).find((token) => token.type === 'button');
const row = '<p class="g-md-button-plugin-row">';

describe('Button Markdown', () => {
    it('should preserve the model through HTML attributes', () => {
        const model = {
            ...buttonDefaults,
            href: '/help',
            view: 'outline',
            color: 'blue',
            target: '_blank',
        } as const;
        const attrs = buttonAttrs(model);
        expect(buttonFromAttrs((name) => attrs[name as keyof typeof attrs])).toEqual(model);
    });
    it.each([
        ['javascript', 'alert(1)'].join(':'),
        'data:text/html,<b>x</b>',
        'file:///etc/passwd',
    ])('should drop the unsafe address %j from the attributes', (href) => {
        expect(buttonAttrs({href})).not.toHaveProperty('href');
        expect(buttonFromAttrs((name) => (name === 'href' ? href : null)).href).toBe('');
    });
    it('should render a button with defaults', () => {
        expect(md.renderInline(':button[Read more]{href="/page"}')).toBe(
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
    it.each([':button[]', ':button[   ]', ':button[]{href="/page"}'])(
        'should render nothing for the empty button %j',
        (markup) => {
            expect(md.renderInline(`Before${markup}After`)).toBe('BeforeAfter');
        },
    );
    it.each([
        // eslint-disable-next-line no-script-url -- Verify rejection of executable URLs.
        'javascript:alert(1)',
        'data:image/png;base64,abc',
        'vbscript:msgbox(1)',
        'file:///tmp/file',
    ])('should omit unsafe href %s', (href) => {
        expect(openToken(`:button[Open]{href="${href}"}`)?.attrGet('href')).toBeNull();
    });
    it('should protect links opened in a new tab', () => {
        expect(
            md.renderInline(':button[Open]{href="https://example.com" target="_blank"}'),
        ).toContain('target="_blank" rel="noopener noreferrer"');
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
            expect(tokens.filter((token) => token.type === 'button')).toHaveLength(2);
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
    ])('should read the href %s like the address of a link', (href) => {
        const link = inlineTokens(`[Open](${href})`).find((token) => token.type === 'link_open');
        expect(openToken(`:button[Open]{href="${href}"}`)?.attrGet('href')).toBe(
            link?.attrGet('href'),
        );
    });
    it.each([
        ['&#106;avascript', 'alert(1)'].join(':'),
        'data:image/png;base64,AAAA',
    ])('should drop the unsafe href %s', (href) => {
        expect(openToken(`:button[Open]{href="${href}"}`)?.attrGet('href')).toBeNull();
    });
    it('should omit a repeated href', () => {
        expect(openToken(':button[Open]{href="/one" href="/two"}')?.attrGet('href')).toBeNull();
    });
    it.each([
        ['only buttons', ':button[One] :button[Two]', row],
        ['a single button', ':button[One]', row],
        ['buttons without a separator', ':button[One]:button[Two]', row],
        ['buttons with spaces around', '  :button[One]   :button[Two]  ', row],
        ['buttons on adjacent lines', ':button[One]\n:button[Two]', row],
        ['a button and an empty button', ':button[One] :button[]', row],
        ['a button and text', ':button[One] text', '<p>'],
        ['text and a button', 'text :button[One]', '<p>'],
        ['a button and a link', ':button[One] [link](/page)', '<p>'],
        ['a button and an escaped space', ':button[One]&nbsp;:button[Two]', '<p>'],
        ['a button in emphasis', '**:button[One]**', '<p>'],
        ['a button in a tight list item', '- :button[One]', '<ul>\n<li><a '],
        ['a button in a loose list item', '- :button[One]\n\n- :button[Two]', `<ul>\n<li>\n${row}`],
        ['a button in a quote', '> :button[One]', `<blockquote>\n${row}`],
    ])('should start a paragraph of %s with %j', (_name, markup, start) => {
        expect(md.render(markup).startsWith(start)).toBe(true);
    });
    it('should render each paragraph of buttons as a row', () => {
        expect(md.render(':button[One]\n\n:button[Two]').split(row)).toHaveLength(3);
    });
    it('should mark a paragraph of buttons inside a header', () => {
        const parser = new MarkdownIt().use(headerPlugin).use(buttonPlugin);
        expect(parser.render(':::header\n:button[One] :button[Two]\n:::')).toContain(`\n${row}<a `);
    });
    it('should add the row class once when the plugin is used twice', () => {
        const parser = new MarkdownIt().use(buttonPlugin).use(buttonPlugin);
        expect(parser.render(':button[One]').startsWith(`${row}<a `)).toBe(true);
    });
    it.each([':button[]', ':button[] :button[  ]{href="/page"}'])(
        'should render no paragraph for the empty buttons %j',
        (markup) => {
            expect(md.render(markup).trim()).toBe('');
        },
    );
    it.each([':button', ':button{href="/page"}', ':button[Label](url)'])(
        'should not render a button for unsupported syntax %j',
        (markup) => {
            expect(md.renderInline(markup)).not.toContain(buttonClassName);
        },
    );
});
