import MarkdownIt from 'markdown-it';
import {describe, expect, it} from 'vitest';

import {buttonAttrs, buttonFromAttrs, buttonPlugin, headerPlugin} from '../index';

import {buttonClassName, buttonDefaults, buttonViewColors} from './model';

const md = new MarkdownIt({html: true}).use(buttonPlugin);
const inlineTokens = (markup: string) => md.parseInline(markup, {})[0].children ?? [];
const openToken = (markup: string) =>
    inlineTokens(markup).find((token) => token.type === 'button_open');

describe('Button Markdown', () => {
    it('should preserve the model through HTML attributes', () => {
        const model = {
            ...buttonDefaults,
            href: '/help',
            view: 'outline',
            color: 'info',
            target: '_blank',
        } as const;
        const attrs = buttonAttrs(model);
        expect(buttonFromAttrs((name) => attrs[name as keyof typeof attrs])).toEqual(model);
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
            expect(tokens.filter((token) => token.type === 'button_open')).toHaveLength(2);
        },
    );
    it.each([':button', ':button{href="/page"}', ':button[Label](url)'])(
        'should not render a button for unsupported syntax %j',
        (markup) => {
            expect(md.renderInline(markup)).not.toContain(buttonClassName);
        },
    );
});
