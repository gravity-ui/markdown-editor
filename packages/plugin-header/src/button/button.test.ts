import MarkdownIt from 'markdown-it';
import {describe, expect, it} from 'vitest';

import {headerPlugin} from '../header';
import {headerPreset} from '../preset';

import {buttonAttrs, buttonFromAttrs, buttonPlugin} from './index';

const md = new MarkdownIt({html: true}).use(buttonPlugin);

const cls = (view: string, color: string) =>
    `g-md-button-plugin g-md-button-plugin_view_${view} g-md-button-plugin_color_${color}`;
const data = (view: string, color: string) => `data-view="${view}" data-color="${color}"`;
/** The default button with the given attributes between its class and data attributes. */
const defaultButton = (attrs: string, label = 'Label') =>
    `<a class="${cls('action', 'standard')}"${attrs && ` ${attrs}`} ${data('action', 'standard')}>${label}</a>`;

describe('Button Markdown', () => {
    it.each([
        ['action', 'standard'],
        ['action', 'blue'],
        ['action', 'green'],
        ['action', 'yellow'],
        ['action', 'red'],
        ['action', 'violet'],
        ['normal', 'gray'],
        ['normal', 'blue'],
        ['normal', 'green'],
        ['normal', 'yellow'],
        ['normal', 'red'],
        ['normal', 'violet'],
        ['outline', 'gray'],
        ['outline', 'blue'],
        ['outline', 'green'],
        ['outline', 'yellow'],
        ['outline', 'red'],
        ['outline', 'violet'],
        ['flat', 'standard'],
        ['flat', 'gray'],
        ['flat', 'blue'],
        ['flat', 'green'],
        ['flat', 'yellow'],
        ['flat', 'red'],
        ['flat', 'violet'],
    ])('should render the %s view with the %s color', (view, color) => {
        expect(md.renderInline(`:button[Label]{view="${view}" color="${color}"}`)).toBe(
            `<a class="g-md-button-plugin g-md-button-plugin_view_${view} g-md-button-plugin_color_${color}" data-view="${view}" data-color="${color}">Label</a>`,
        );
    });

    it.each([
        ['', 'action', 'standard'],
        ['view="action"', 'action', 'standard'],
        ['view="normal"', 'normal', 'gray'],
        ['view="outline"', 'outline', 'gray'],
        ['view="flat"', 'flat', 'standard'],
        ['color="blue"', 'action', 'blue'],
        ['view="action" color="gray"', 'action', 'standard'],
        ['view="normal" color="standard"', 'normal', 'gray'],
        ['view="outline" color="standard"', 'outline', 'gray'],
        ['view="flat" color="orange"', 'flat', 'standard'],
        ['view="action" color="brand"', 'action', 'standard'],
        ['view="normal" color="info"', 'normal', 'gray'],
        ['view="outline" color="BLUE"', 'outline', 'gray'],
        ['view="outlined" color="blue"', 'action', 'blue'],
        ['view="unknown" color="gray"', 'action', 'standard'],
        ['view="flat" view="normal" color="red"', 'action', 'red'],
        ['view=flat color=violet', 'flat', 'violet'],
        ["view='outline' color='green'", 'outline', 'green'],
    ])('should resolve the style of {%s} to %s and %s', (attrs, view, color) => {
        expect(md.renderInline(`:button[Label]{${attrs}}`)).toBe(
            `<a class="${cls(view, color)}" ${data(view, color)}>Label</a>`,
        );
    });

    it.each([
        ['_blank', 'target="_blank" rel="noopener noreferrer"'],
        ['_parent', 'target="_parent"'],
        ['_top', 'target="_top"'],
        ['_self', ''],
        ['popup', ''],
        ['_BLANK', ''],
        ['', ''],
    ])('should render the target %j as %j', (target, attrs) => {
        expect(md.renderInline(`:button[Label]{href="/page" target="${target}"}`)).toBe(
            defaultButton(`href="/page"${attrs && ` ${attrs}`}`),
        );
    });

    it.each([
        ['"/page"', 'href="/page"'],
        ['"./guide/start.md#install"', 'href="./guide/start.md#install"'],
        ['"#anchor"', 'href="#anchor"'],
        ['"https://example.com/docs"', 'href="https://example.com/docs"'],
        ['"mailto:team@example.com"', 'href="mailto:team@example.com"'],
        ['"  /page  "', 'href="/page"'],
        ["'/page'", 'href="/page"'],
        ['page', 'href="page"'],
        ['"/search?q=a b"', 'href="/search?q=a%20b"'],
        ['"/путь"', 'href="/%D0%BF%D1%83%D1%82%D1%8C"'],
        ['"/a?x=\\"1\\""', 'href="/a?x=%221%22"'],
        ['"/a\\\\b"', 'href="/a%5Cb"'],
    ])('should render the href %s as %s', (href, attrs) => {
        expect(md.renderInline(`:button[Label]{href=${href}}`)).toBe(defaultButton(attrs));
    });

    // The attribute value in HTML escapes `&`, so a browser reads the address exactly as written.
    it.each([
        ['/page?a=1&b=2', 'href="/page?a=1&amp;b=2"'],
        ['/image&copy;.png', 'href="/image&amp;copy;.png"'],
        ['/page?a=1&copy=2&reg;=3', 'href="/page?a=1&amp;copy=2&amp;reg;=3"'],
        ['/page?a=1&amp;b=2', 'href="/page?a=1&amp;amp;b=2"'],
        ['/image&#10;.png', 'href="/image&amp;#10;.png"'],
        ['/image&#x41;.png', 'href="/image&amp;#x41;.png"'],
        ['/a&lt;b&gt;c&quot;d', 'href="/a&amp;lt;b&amp;gt;c&amp;quot;d"'],
    ])('should keep HTML entities of the href %s', (href, attrs) => {
        const html = md.renderInline(`:button[Label]{href="${href}"}`);
        expect(html).toBe(defaultButton(attrs));
        expect(md.utils.unescapeAll(/href="([^"]*)"/.exec(html)?.[1] ?? '')).toBe(href);
    });

    it.each([
        [':button[Label]'],
        [':button[Label]{}'],
        [':button[Label]{href=""}'],
        [':button[Label]{href="   "}'],
        [':button[Label]{href="/one" href="/two"}'],

        [':button[Label]{href="javascript:alert(1)"}'],

        [':button[Label]{href="JavaScript:alert(1)"}'],
        [':button[Label]{href="vbscript:msgbox(1)"}'],
        [':button[Label]{href="file:///tmp/file"}'],
        [':button[Label]{href="data:image/png;base64,abc"}'],
        [':button[Label]{href="data:text/html,<b>x</b>"}'],
    ])('should render %s as a link without an address', (markup) => {
        expect(md.renderInline(markup)).toBe(defaultButton(''));
    });

    it.each([
        [
            'buttons separated by spaces',
            ':button[One]{view="action" color="blue"} :button[Two]{view="normal" color="gray"} :button[Three]{view="flat" color="standard"}',
            `<p><a class="${cls('action', 'blue')}" ${data('action', 'blue')}>One</a> <a class="${cls('normal', 'gray')}" ${data('normal', 'gray')}>Two</a> <a class="${cls('flat', 'standard')}" ${data('flat', 'standard')}>Three</a></p>\n`,
        ],
        [
            'buttons without a separator',
            ':button[One]:button[Two]',
            `<p>${defaultButton('', 'One')}${defaultButton('', 'Two')}</p>\n`,
        ],
        [
            'buttons on adjacent lines',
            ':button[One]\n:button[Two]',
            `<p>${defaultButton('', 'One')}\n${defaultButton('', 'Two')}</p>\n`,
        ],
        [
            'buttons in separate paragraphs',
            ':button[One]\n\n:button[Two]',
            `<p>${defaultButton('', 'One')}</p>\n<p>${defaultButton('', 'Two')}</p>\n`,
        ],
        [
            'buttons in a line of text',
            'Press :button[One]{href="/one"} or :button[Two] now',
            `<p>Press ${defaultButton('href="/one"', 'One')} or ${defaultButton('', 'Two')} now</p>\n`,
        ],
        [
            'a button inside emphasis',
            '**:button[One]**',
            `<p><strong>${defaultButton('', 'One')}</strong></p>\n`,
        ],
        [
            'a button in a list item',
            '- :button[One]',
            `<ul>\n<li>${defaultButton('', 'One')}</li>\n</ul>\n`,
        ],
    ])('should render %s', (_name, markup, html) => {
        expect(md.render(markup)).toBe(html);
    });

    it.each([
        ['Read more', 'Read more'],
        ['  Padded  ', 'Padded'],
        ['Подробнее', 'Подробнее'],
        ['**Bold** _italic_ `code`', '**Bold** _italic_ `code`'],
        ['[link](/page)', '[link](/page)'],
        ['<b>tag</b>', '&lt;b&gt;tag&lt;/b&gt;'],
        ['Q&A', 'Q&amp;A'],
        ['&copy; &amp; &#169;', '&amp;copy; &amp;amp; &amp;#169;'],
        ['"quoted"', '&quot;quoted&quot;'],
        ['a \\] b', 'a ] b'],
        ['[pair]', '[pair]'],
        ['a \\* b', 'a * b'],
    ])('should render the label %j as the text %j', (label, text) => {
        expect(md.renderInline(`:button[${label}]`)).toBe(defaultButton('', text));
    });

    it.each([':button[]', ':button[   ]', ':button[]{href="/page"}'])(
        'should render nothing for the empty button %j',
        (markup) => {
            expect(md.renderInline(`Before${markup}After`)).toBe('BeforeAfter');
        },
    );

    it.each([
        [':button', ':button'],
        [':button{href="/page"}', ':button{href=&quot;/page&quot;}'],
        [':button[Label](url)', ':button<a href="url">Label</a>'],
        [':buttons[Label]', ':buttons[Label]'],
        ['\\:button[Label]', ':button[Label]'],
        ['`:button[Label]`', '<code>:button[Label]</code>'],
    ])('should leave the unsupported syntax %j as Markdown', (markup, html) => {
        expect(md.renderInline(markup)).toBe(html);
    });

    it.each([
        ['hidden="true"'],
        ['onclick="alert(1)"'],
        ['style="color:red"'],
        ['class="extra"'],
        ['.extra'],
        ['#anchor'],
        ['rel="opener"'],
        ['data-view="flat"'],
    ])('should ignore the unsupported attribute {%s}', (attrs) => {
        expect(md.renderInline(`:button[Label]{${attrs}}`)).toBe(defaultButton(''));
    });

    it.each([
        ['headerPlugin, buttonPlugin', [headerPlugin, buttonPlugin]],
        ['buttonPlugin, headerPlugin', [buttonPlugin, headerPlugin]],
        ['headerPreset', [headerPreset]],
        ['headerPreset, buttonPlugin', [headerPreset, buttonPlugin]],
    ])('should render buttons inside a header with %s', (_name, plugins) => {
        const parser = new MarkdownIt();
        for (const plugin of plugins) parser.use(plugin);
        expect(
            parser.render(
                ':::header\n\n:button[One]{href="/one"} :button[Two]{view="flat" color="gray"}\n\n:::',
            ),
        ).toBe(
            '<div class="g-md-header-plugin g-md-header-plugin_height_s g-md-header-plugin_width_m" data-height="s" data-width="m">\n' +
                `<p>${defaultButton('href="/one"', 'One')} <a class="${cls('flat', 'gray')}" ${data('flat', 'gray')}>Two</a></p>\n` +
                '</div>\n',
        );
    });

    it.each([
        [
            {href: '/help', view: 'outline', color: 'blue', target: '_blank'},
            {href: '/help', view: 'outline', color: 'blue', target: '_blank'},
        ],
        [
            {href: '', view: 'flat', color: 'gray', target: '_self'},
            {href: '', view: 'flat', color: 'gray', target: '_self'},
        ],
        [{}, {href: '', view: 'action', color: 'standard', target: '_self'}],
        [
            {view: 'normal', color: 'standard', target: 'popup'},
            {href: '', view: 'normal', color: 'gray', target: '_self'},
        ],
    ])('should restore the model of %j from HTML attributes', (input, model) => {
        const attrs: Record<string, string> = buttonAttrs(input);
        expect(buttonFromAttrs((name) => attrs[name])).toEqual(model);
    });

    it('should keep the label and the attributes in the token', () => {
        const [token] = md.parseInline(':button[Read more]{href="/a&copy;b" view="flat"}', {})[0]
            .children ?? [undefined];
        expect(token).toMatchObject({
            type: 'button',
            tag: 'a',
            content: 'Read more',
            attrs: [
                ['class', cls('flat', 'standard')],
                ['href', '/a&copy;b'],
                ['data-view', 'flat'],
                ['data-color', 'standard'],
            ],
        });
    });
});
