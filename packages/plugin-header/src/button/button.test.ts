import MarkdownIt from 'markdown-it';
import {describe, expect, it} from 'vitest';

import {buttonAttrs, buttonFromAttrs, buttonPlugin, headerPlugin} from '../index';

import {buttonDefaults, buttonViewColors} from './model';

const md = new MarkdownIt({html: true}).use(buttonPlugin);
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
    it('should render adjacent buttons without whitespace between their links', () => {
        const markup = ':::button\nOne\n:::\n\n:::button\nTwo\n:::';
        const html = md.render(markup);
        expect(html).toContain('</a><a');
        expect(html).not.toContain('</a>\n');
    });
    it('should render a standalone button with defaults', () => {
        expect(md.render(':::button{href="/page"}\nRead more\n:::')).toBe(
            '<a class="g-md-button-plugin g-md-button-plugin_view_action g-md-button-plugin_color_standard" href="/page" data-view="action" data-color="standard">Read more</a>',
        );
    });
    for (const [view, colors] of Object.entries(buttonViewColors)) {
        for (const color of colors) {
            it(`should pass the ${view} view with the ${color} color to the token`, () => {
                const [token] = md.parse(
                    `:::button{view="${view}" color="${color}"}\nLabel\n:::`,
                    {},
                );
                expect(token.attrGet('data-view')).toBe(view);
                expect(token.attrGet('data-color')).toBe(color);
            });
        }
    }
    it('should keep the complete body as plain text', () => {
        const body = '**Bold** & <script>alert(1)</script>\n\nSecond paragraph';
        const [token] = md.parse(`:::button\n${body}\n:::`, {});
        expect(token.content.trim()).toBe(body);
        const html = md.render(`:::button\n${body}\n:::`);
        expect(html).toContain('**Bold** &amp; &lt;script&gt;');
        expect(html).toContain('Second paragraph');
        expect(html).not.toContain('<script>');
    });
    it.each([
        // eslint-disable-next-line no-script-url -- Verify rejection of executable URLs.
        'javascript:alert(1)',
        'data:image/png;base64,abc',
        'vbscript:msgbox(1)',
        'file:///tmp/file',
    ])('should omit unsafe href %s', (href) => {
        expect(md.parse(`:::button{href="${href}"}\nOpen\n:::`, {})[0].attrGet('href')).toBeNull();
    });
    it('should protect links opened in a new tab', () => {
        expect(
            md.render(':::button{href="https://example.com" target="_blank"}\nOpen\n:::'),
        ).toContain('target="_blank" rel="noopener noreferrer"');
    });
    it('should ignore unsupported attributes and normalize styles', () => {
        const [token] = md.parse(
            ':::button{view="unknown" color="gray" target="popup" hidden="true" onclick="alert(1)"}\nVisible\n:::',
            {},
        );
        expect(token.attrGet('data-view')).toBe('action');
        expect(token.attrGet('data-color')).toBe('standard');
        expect(token.attrGet('hidden')).toBeNull();
        expect(token.attrGet('onclick')).toBeNull();
        expect(token.attrGet('target')).toBeNull();
    });
    it.each([false, true])(
        'should work with Header regardless of registration order: %s',
        (headerFirst) => {
            const parser = new MarkdownIt();
            parser
                .use(headerFirst ? headerPlugin : buttonPlugin)
                .use(headerFirst ? buttonPlugin : headerPlugin);
            const buttons = ['One', 'Two'].map((label) => `:::button\n${label}\n:::`).join('\n\n');
            expect(
                parser
                    .parse(`:::header\n${buttons}\n:::`, {})
                    .filter((token) => token.type === 'button'),
            ).toHaveLength(2);
        },
    );
    it.each([':::button[Label]\n:::', ':::button(url)\n:::', ':::button\nUnclosed'])(
        'should leave unsupported syntax unchanged in %j',
        (markup) => {
            expect(md.parse(markup, {}).some((token) => token.type === 'button')).toBe(false);
        },
    );
});
