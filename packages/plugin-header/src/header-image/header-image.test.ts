import MarkdownIt from 'markdown-it';
import {describe, expect, it} from 'vitest';

import {
    defaultHeaderTag,
    example,
    exampleButtons,
    exampleContent,
    exampleId,
    exampleImage,
    exampleImageUrl,
    exampleTitle,
    header,
    mixedExamples,
    mixedMarkup,
    structureExamples,
    structureMarkup,
} from '../../tests/examples';
import {headerPreset} from '../preset';

import {
    headerImage,
    headerImageAttrs,
    headerImageFromAttrs,
    headerImagePlugin,
    headerImageValues,
} from './index';

const md = new MarkdownIt({html: true}).use(headerImagePlugin);
const preset = new MarkdownIt().use(headerPreset);

/** The image with the given address, alternative text and title; without a title there is no attribute. */
const image = (src = '/image.jpg', alt = '', title?: string) =>
    `<img class="g-md-header-image-plugin" data-files-gallery-exclude="true" src="${src}" alt="${alt}"${title === undefined ? '' : ` title="${title}"`}>\n`;
/** The images of a rendered document. */
const images = (output: string) =>
    output.match(
        /<img class="g-md-header-image-plugin" data-files-gallery-exclude="true"[^>]*>\n/g,
    ) ?? [];
// Built at runtime for the `no-script-url` lint rule.
const scriptUrl = ['javascript', 'alert(1)'].join(':');
const titleHtml =
    '<div class="g-md-header-title-plugin g-md-header-title-plugin_size_2" role="heading" aria-level="2">Team portal</div>\n';

// image-001 … image-012: the kinds of the address, each without and with the alternative text
// and the title. The examples of a relative path have the address of the banner.
const imageExamples = [
    ['HTTPS', 'https://example.org/image.jpg'],
    ['HTTP', 'http://example.org/image.jpg'],
    ['relative path', exampleImageUrl],
]
    .flatMap(([url, src]) =>
        [false, true].flatMap((alt) =>
            [false, true].map((title) => ({
                url,
                alt,
                title,
                attrs: [
                    `src="${src}"`,
                    alt ? 'alt="Team"' : '',
                    title ? 'title="Project team"' : '',
                ]
                    .filter(Boolean)
                    .join(' '),
                html: image(src, alt ? 'Team' : '', title ? 'Project team' : undefined),
            })),
        ),
    )
    .map((item, index) => ({id: exampleId('image', index), ...item}));

describe('Header image Markdown', () => {
    it.each([
        [
            'https://example.org/image.jpg',
            '<img class="g-md-header-image-plugin" data-files-gallery-exclude="true" src="https://example.org/image.jpg" alt="">\n',
        ],
        [
            'http://example.org/image.jpg',
            '<img class="g-md-header-image-plugin" data-files-gallery-exclude="true" src="http://example.org/image.jpg" alt="">\n',
        ],
        [
            'HTTPS://EXAMPLE.ORG/IMAGE.JPG',
            '<img class="g-md-header-image-plugin" data-files-gallery-exclude="true" src="HTTPS://EXAMPLE.ORG/IMAGE.JPG" alt="">\n',
        ],
        [
            'blob:https://example.org/0a1b2c3d',
            '<img class="g-md-header-image-plugin" data-files-gallery-exclude="true" src="blob:https://example.org/0a1b2c3d" alt="">\n',
        ],
        [
            '//example.org/image.jpg',
            '<img class="g-md-header-image-plugin" data-files-gallery-exclude="true" src="//example.org/image.jpg" alt="">\n',
        ],
        [
            '/image.jpg',
            '<img class="g-md-header-image-plugin" data-files-gallery-exclude="true" src="/image.jpg" alt="">\n',
        ],
        [
            './.files/image.jpg',
            '<img class="g-md-header-image-plugin" data-files-gallery-exclude="true" src="./.files/image.jpg" alt="">\n',
        ],
        [
            '../images/image.jpg',
            '<img class="g-md-header-image-plugin" data-files-gallery-exclude="true" src="../images/image.jpg" alt="">\n',
        ],
        [
            'image.jpg',
            '<img class="g-md-header-image-plugin" data-files-gallery-exclude="true" src="image.jpg" alt="">\n',
        ],
        [
            'images/photo 1 (final).jpg',
            '<img class="g-md-header-image-plugin" data-files-gallery-exclude="true" src="images/photo 1 (final).jpg" alt="">\n',
        ],
        [
            '/image.jpg?size=l#top',
            '<img class="g-md-header-image-plugin" data-files-gallery-exclude="true" src="/image.jpg?size=l#top" alt="">\n',
        ],
        [
            '  /image.jpg  ',
            '<img class="g-md-header-image-plugin" data-files-gallery-exclude="true" src="/image.jpg" alt="">\n',
        ],
        [
            '/картинка.jpg',
            '<img class="g-md-header-image-plugin" data-files-gallery-exclude="true" src="/картинка.jpg" alt="">\n',
        ],
    ])('should render the address %j', (src, html) => {
        expect(md.render(`::header-image{src="${src}"}`)).toBe(html);
    });

    // The address is taken as written: an HTML entity in it is not a character.
    it.each([
        ['/image?a=1&copy=2', '/image?a=1&amp;copy=2'],
        ['/image?a=1&amp;b=2', '/image?a=1&amp;amp;b=2'],
        ['/image?a=&lt;b&gt;', '/image?a=&amp;lt;b&amp;gt;'],
        ['/image&#10;.jpg', '/image&amp;#10;.jpg'],
        // Not decoded, so it is a relative address and not a script.
        ['&#106;avascript:alert(1)', '&amp;#106;avascript:alert(1)'],
        ['/a\\"b.jpg', '/a&quot;b.jpg'],
        ['/a\\\\b.jpg', '/a\\b.jpg'],
        ['/a<b>.jpg', '/a&lt;b&gt;.jpg'],
    ])('should keep the address %j as written', (src, rendered) => {
        expect(md.render(`::header-image{src="${src}"}`)).toBe(image(rendered));
    });

    it.each([
        scriptUrl,
        scriptUrl.replace('j', 'J').replace('s', 'S'),
        ' javascript:alert(1)',
        'data:image/png;base64,iVBORw0KGgo=',
        'data:text/html,<script>alert(1)</script>',
        'vbscript:msgbox(1)',
        'file:///etc/passwd',
        'ftp://example.org/image.jpg',
        'mailto:team@example.org',
        'x-scheme:image',
        '',
        '   ',
    ])('should render nothing for the unsupported address %j', (src) => {
        const markup = `::header-image{src="${src}" alt="Team" title="Project team"}`;
        expect(md.render(markup)).toBe('');
        // The token stays for a parser of the token stream, without an address.
        const tokens = md.parse(markup, {});
        expect(tokens.map((token) => token.type)).toEqual(['header-image']);
        expect(tokens[0].attrs).toEqual([
            ['class', 'g-md-header-image-plugin'],
            ['data-files-gallery-exclude', 'true'],
            ['alt', 'Team'],
            ['title', 'Project team'],
        ]);
    });

    it.each([
        '::header-image',
        '::header-image{}',
        '::header-image{alt="Team"}',
        '::header-image{title="Project team"}',
        '::header-image{href="/image.jpg"}',
        '::header-image{src="/image.jpg" src="/other.jpg"}',
        '::header-image{src=/image.jpg}',
    ])('should render nothing for the image without an address %j', (markup) => {
        expect(md.render(markup)).toBe('');
        expect(md.parse(markup, {}).map((token) => token.type)).toEqual(['header-image']);
    });

    it.each([
        ['alt="Team"', image('/image.jpg', 'Team')],
        ['alt=""', image()],
        ['alt=" "', image('/image.jpg', ' ')],
        ['alt="Команда проекта 🚀"', image('/image.jpg', 'Команда проекта 🚀')],
        [
            'alt="A <b>team</b> & a \\"quote\\""',
            image('/image.jpg', 'A &lt;b&gt;team&lt;/b&gt; &amp; a &quot;quote&quot;'),
        ],
        ['alt="Q&amp;A &copy;"', image('/image.jpg', 'Q&amp;amp;A &amp;copy;')],
        ["alt='Team'", image('/image.jpg', 'Team')],
        ['alt=Team', image('/image.jpg', 'Team')],
        ['alt="Team" alt="Other"', image()],
    ])('should render the alternative text of %j', (attrs, html) => {
        expect(md.render(`::header-image{src="/image.jpg" ${attrs}}`)).toBe(html);
    });

    it.each([
        ['title="Project team"', image('/image.jpg', '', 'Project team')],
        ['title=""', image()],
        ['title=" "', image('/image.jpg', '', ' ')],
        ['title="Команда проекта 🚀"', image('/image.jpg', '', 'Команда проекта 🚀')],
        [
            'title="A <b>team</b> & a \\"quote\\""',
            image('/image.jpg', '', 'A &lt;b&gt;team&lt;/b&gt; &amp; a &quot;quote&quot;'),
        ],
        ['title="Q&amp;A &copy;"', image('/image.jpg', '', 'Q&amp;amp;A &amp;copy;')],
        ["title='Project team'", image('/image.jpg', '', 'Project team')],
        ['title=Team', image('/image.jpg', '', 'Team')],
        ['title="Team" title="Other"', image()],
    ])('should render the title of %j', (attrs, html) => {
        expect(md.render(`::header-image{src="/image.jpg" ${attrs}}`)).toBe(html);
    });

    it.each([
        ['::header-image{src="/image.jpg"}', image()],
        ['::header-image{src="/image.jpg" alt="" title=""}', image()],
        // A title without the alternative text is a tooltip of a decorative image.
        [
            '::header-image{src="/image.jpg" title="Project team"}',
            image('/image.jpg', '', 'Project team'),
        ],
        [
            '::header-image{title="Project team" alt="Team" src="/image.jpg"}',
            image('/image.jpg', 'Team', 'Project team'),
        ],
        ["::header-image{src='/image.jpg' alt='Team'}", image('/image.jpg', 'Team')],
        ['::header-image{ src="/image.jpg"   alt="Team" }', image('/image.jpg', 'Team')],
        ['  ::header-image{src="/image.jpg"}', image()],
    ])('should apply independent defaults and read the attributes of %j', (markup, html) => {
        expect(md.render(markup)).toBe(html);
    });

    it.each([
        '::header-image{src="/image.jpg" unknown="value"}',
        '::header-image{src="/image.jpg" .custom #id}',
        '::header-image{src="/image.jpg" onerror="alert(1)" onload="alert(1)" style="width:9999px" class="x"}',
        '::header-image{src="/image.jpg" width="100" height="100" srcset="/other.jpg 2x" loading="lazy"}',
        '::header-image{src="/image.jpg" size="1" color="red" href="/page"}',
    ])('should skip an unsupported attribute in %j', (markup) => {
        expect(md.render(markup)).toBe(image());
    });

    it.each([
        '::header-image[Team]{src="/image.jpg"}',
        '::header-image[]{src="/image.jpg"}',
        '::header-image(/image.jpg)',
        ':header-image{src="/image.jpg"}',
        ':::header-image{src="/image.jpg"}\n:::',
        '::header-images{src="/image.jpg"}',
        '    ::header-image{src="/image.jpg"}',
        'Text\n::header-image{src="/image.jpg"}',
    ])('should leave unsupported syntax as Markdown in %j', (markup) => {
        expect(md.parse(markup, {}).some((token) => token.type === 'header-image')).toBe(false);
        expect(md.render(markup)).not.toContain('g-md-header-image-plugin');
    });

    it.each([
        ['outside a header', '::header-image{src="/image.jpg"}'],
        ['inside a header', ':::header\n\n::header-image{src="/image.jpg"}\n:::'],
    ])('should opt the image %s out of the files galleries', (_place, markup) => {
        const token = preset.parse(markup, {}).find(({type}) => type === 'header-image');
        expect(token?.attrGet('data-files-gallery-exclude')).toBe('true');
        expect(preset.render(markup)).toContain(
            '<img class="g-md-header-image-plugin" data-files-gallery-exclude="true" src="/image.jpg" alt="">',
        );
    });

    it('should parse the image as one block token with its attributes', () => {
        const tokens = md.parse(
            'Before\n\n::header-image{src="/image.jpg" alt="Team" title="Project team"}',
            {},
        );
        expect(tokens.map((token) => token.type)).toEqual([
            'paragraph_open',
            'inline',
            'paragraph_close',
            'header-image',
        ]);
        const token = tokens[3];
        expect(token.tag).toBe('img');
        expect(token.block).toBe(true);
        expect(token.nesting).toBe(0);
        expect(token.map).toEqual([2, 3]);
        expect(token.markup).toBe('::header-image');
        expect(token.content).toBe('');
        expect(token.children).toBeNull();
        expect(token.attrs).toEqual([
            ['class', 'g-md-header-image-plugin'],
            ['data-files-gallery-exclude', 'true'],
            ['src', '/image.jpg'],
            ['alt', 'Team'],
            ['title', 'Project team'],
        ]);
    });

    it.each([
        [
            'after a paragraph',
            'Before\n\n::header-image{src="/image.jpg"}\n\nAfter',
            `<p>Before</p>\n${image()}<p>After</p>\n`,
        ],
        [
            'before a paragraph without an empty line',
            '::header-image{src="/image.jpg"}\nAfter',
            `${image()}<p>After</p>\n`,
        ],
        [
            'in a list item',
            '- ::header-image{src="/image.jpg"}',
            `<ul>\n<li>\n${image()}</li>\n</ul>\n`,
        ],
        [
            'in a quote',
            '> ::header-image{src="/image.jpg"}',
            `<blockquote>\n${image()}</blockquote>\n`,
        ],
        [
            'twice',
            '::header-image{src="/first.jpg"}\n\n::header-image{src="/second.jpg"}',
            image('/first.jpg') + image('/second.jpg'),
        ],
    ])('should render the image %s', (_name, markup, html) => {
        expect(md.render(markup)).toBe(html);
    });

    it('should close the tag in the XHTML output', () => {
        const xhtml = new MarkdownIt({xhtmlOut: true}).use(headerImagePlugin);
        expect(xhtml.render('::header-image{src="/image.jpg" alt="Team"}')).toBe(
            '<img class="g-md-header-image-plugin" data-files-gallery-exclude="true" src="/image.jpg" alt="Team" />\n',
        );
    });

    it('should render once when the plugin is used several times', () => {
        const twice = new MarkdownIt().use(headerImagePlugin).use(headerImagePlugin);
        expect(twice.render('::header-image{src="/image.jpg"}')).toBe(image());
    });
});

describe('Header image options', () => {
    it.each([
        [{}, {src: null, alt: '', title: null}, {}],
        [{src: '/image.jpg'}, {src: '/image.jpg', alt: '', title: null}, {src: '/image.jpg'}],
        [
            {src: ' https://example.org/image.jpg ', alt: 'Team', title: 'Project team'},
            {src: 'https://example.org/image.jpg', alt: 'Team', title: 'Project team'},
            {src: 'https://example.org/image.jpg', alt: 'Team', title: 'Project team'},
        ],
        [
            {src: 'blob:https://example.org/0a1b', alt: '', title: ''},
            {src: 'blob:https://example.org/0a1b', alt: '', title: null},
            {src: 'blob:https://example.org/0a1b'},
        ],
        [{src: scriptUrl, alt: 'Team'}, {src: null, alt: 'Team', title: null}, {alt: 'Team'}],
        [{src: 'data:image/png;base64,AAAA'}, {src: null, alt: '', title: null}, {}],
        [{src: '/image\n.jpg'}, {src: null, alt: '', title: null}, {}],
        [{src: 1, alt: 2, title: 3}, {src: null, alt: '', title: null}, {}],
        [
            {src: ['/a.jpg', '/b.jpg'], alt: ['Team'], title: ['Project team']},
            {src: null, alt: '', title: null},
            {},
        ],
        [{src: null, alt: null, title: undefined}, {src: null, alt: '', title: null}, {}],
    ])('should resolve the options of %j', (attrs, options, values) => {
        expect(headerImage(attrs)).toEqual(options);
        expect(headerImageValues(headerImage(attrs))).toEqual(values);
    });

    it.each([
        [{}, {class: 'g-md-header-image-plugin', 'data-files-gallery-exclude': 'true', alt: ''}],
        [
            {src: '/image.jpg'},
            {
                class: 'g-md-header-image-plugin',
                'data-files-gallery-exclude': 'true',
                src: '/image.jpg',
                alt: '',
            },
        ],
        [
            {src: '/image.jpg', alt: 'Team', title: 'Project team'},
            {
                class: 'g-md-header-image-plugin',
                'data-files-gallery-exclude': 'true',
                src: '/image.jpg',
                alt: 'Team',
                title: 'Project team',
            },
        ],
        [
            {src: scriptUrl, alt: 'Team', title: ''},
            {class: 'g-md-header-image-plugin', 'data-files-gallery-exclude': 'true', alt: 'Team'},
        ],
    ])('should build the attributes of %j', (options, attrs) => {
        expect(headerImageAttrs(options)).toEqual(attrs);
        expect(Object.keys(headerImageAttrs(options))).toEqual(Object.keys(attrs));
    });

    it.each([
        {src: '/image.jpg', alt: '', title: null},
        {src: 'https://example.org/image.jpg', alt: 'Team', title: null},
        {src: './.files/image.jpg', alt: '', title: 'Project team'},
        {src: 'blob:https://example.org/0a1b', alt: 'Team', title: 'Project team'},
        {src: null, alt: 'Team', title: 'Project team'},
    ])(
        'should read $src, alt $alt and title $title back from the rendered attributes',
        (options) => {
            const attrs = headerImageAttrs(options);
            expect(headerImageFromAttrs((name) => attrs[name])).toEqual(options);
        },
    );

    it('should read the defaults from an element without the attributes', () => {
        expect(headerImageFromAttrs(() => null)).toEqual({src: null, alt: '', title: null});
    });
});

describe('Header image syntax examples', () => {
    it.each(imageExamples)(
        'should render $id with the $url address, alt $alt and title $title',
        ({attrs, html}) => {
            expect(preset.render(example('', `::header-image{${attrs}}`, exampleTitle))).toBe(
                header(html + titleHtml),
            );
        },
    );

    it.each([
        [
            'image-013',
            'an empty alternative text',
            `::header-image{src="${exampleImageUrl}" alt=""}`,
            '<img class="g-md-header-image-plugin" data-files-gallery-exclude="true" src="https://example.org/banner.jpg" alt="">\n',
        ],
        [
            'image-014',
            'an empty title',
            `::header-image{src="${exampleImageUrl}" title=""}`,
            '<img class="g-md-header-image-plugin" data-files-gallery-exclude="true" src="https://example.org/banner.jpg" alt="">\n',
        ],
        [
            'image-015',
            'an empty alternative text and an empty title',
            `::header-image{src="${exampleImageUrl}" alt="" title=""}`,
            '<img class="g-md-header-image-plugin" data-files-gallery-exclude="true" src="https://example.org/banner.jpg" alt="">\n',
        ],
    ])('should render %s, %s', (_id, _name, markup, html) => {
        expect(preset.render(example('', markup))).toBe(header(html));
    });

    it.each(structureExamples)(
        'should render $id with image $image, title $title, description $content and $buttons buttons',
        (item) => {
            const output = preset.render(structureMarkup(item));
            expect(images(output)).toEqual(item.image ? [image(exampleImageUrl, 'Team')] : []);
            // The image is the first block of its header, as written.
            expect(output.startsWith(`${defaultHeaderTag}\n<img `)).toBe(item.image);
        },
    );

    it.each(mixedExamples)(
        'should render $id with image $image, title $title, description $content and $buttons buttons in the header with every attribute',
        (item) => {
            expect(images(preset.render(mixedMarkup(item)))).toEqual(
                item.image ? [image(exampleImageUrl, 'Team')] : [],
            );
        },
    );

    it('should render structure-032, the image before the title, the description and three buttons', () => {
        expect(preset.render(structureMarkup(structureExamples[31]))).toBe(
            header(
                '<img class="g-md-header-image-plugin" data-files-gallery-exclude="true" src="https://example.org/banner.jpg" alt="Team">\n' +
                    titleHtml +
                    '<div class="g-md-header-content-plugin">\n<p>Portal description.</p>\n</div>\n' +
                    '<p class="g-md-button-plugin-row"><a class="g-md-button-plugin g-md-button-plugin_view_action g-md-button-plugin_color_blue" href="/page" data-view="action" data-color="blue">Button 1</a>\n' +
                    '<a class="g-md-button-plugin g-md-button-plugin_view_normal g-md-button-plugin_color_gray" href="/page" data-view="normal" data-color="gray">Button 2</a>\n' +
                    '<a class="g-md-button-plugin g-md-button-plugin_view_flat g-md-button-plugin_color_standard" href="/page" data-view="flat" data-color="standard">Button 3</a></p>\n',
            ),
        );
    });

    it.each([
        [
            'nested-078',
            'the image of the full banner with a rich description',
            example(
                '',
                exampleImage,
                exampleTitle,
                ':::header-content\n**Team resources:** [documentation](/docs), [contacts](/contacts) and ++announcements++.\n\nUse `team-cli` for routine tasks. *Read the documentation first.*\n:::',
                ...exampleButtons,
            ),
            [image(exampleImageUrl, 'Team')],
        ],
        [
            'boundaries-007',
            'the image in a header with an unknown attribute',
            example('unknown="value"', exampleImage, exampleTitle),
            [image(exampleImageUrl, 'Team')],
        ],
        [
            'defaults-008',
            'no image in a header of empty blocks',
            example('', '::header-title[]', ':::header-content\n:::'),
            [],
        ],
    ])('should render %s, %s', (_id, _name, markup, html) => {
        expect(images(preset.render(markup))).toEqual(html);
    });

    // Dropping blocks by their place or number is a separate task: here they render as written.
    it.each([
        [
            'boundaries-004',
            'an image outside a header',
            `::header-image{src="${exampleImageUrl}"}`,
            '<img class="g-md-header-image-plugin" data-files-gallery-exclude="true" src="https://example.org/banner.jpg" alt="">\n',
        ],
        [
            'a second image',
            'two images in a header',
            example('', '::header-image{src="/first.jpg"}', '::header-image{src="/second.jpg"}'),
            header(image('/first.jpg') + image('/second.jpg')),
        ],
        [
            'an image in a description',
            'an image inside the description of a header',
            example('', `:::header-content\n\n${exampleImage}\n\n:::`),
            header(
                `<div class="g-md-header-content-plugin">\n${image(exampleImageUrl, 'Team')}</div>\n`,
            ),
        ],
    ])('should render %s, %s, as written', (_id, _name, markup, html) => {
        expect(preset.render(markup)).toBe(html);
    });

    it('should render the image between the other blocks of a header in the source order', () => {
        expect(preset.render(example('', exampleTitle, exampleImage, exampleContent, 'Text'))).toBe(
            header(
                `${titleHtml}${image(exampleImageUrl, 'Team')}<div class="g-md-header-content-plugin">\n<p>Portal description.</p>\n</div>\n<p>Text</p>\n`,
            ),
        );
    });

    it('should render an image with a centered header as written', () => {
        expect(preset.render(example('align="center"', exampleImage, exampleTitle))).toBe(
            `<div class="g-md-header-plugin g-md-header-plugin_height_s g-md-header-plugin_width_m g-md-header-plugin_align_center" data-files-gallery-exclude="true" data-height="s" data-width="m" data-align="center">\n${image(exampleImageUrl, 'Team')}${titleHtml}</div>\n`,
        );
    });
});
