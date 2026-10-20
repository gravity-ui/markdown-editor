import MarkdownIt from 'markdown-it';
import {describe, expect, it} from 'vitest';

import {getHeaderExamples} from '../../../../../../demo/src/stories/examples/header/markup';
import {DirectiveContext} from '../../../../tests/utils';
import {ExtensionsManager} from '../../../core';
import {FullSpecsPreset} from '../../../presets/full-specs';

import {
    HeaderAlign,
    HeaderAttr,
    type HeaderAttrs,
    HeaderBorder,
    HeaderDecor,
    HeaderDirection,
    HeaderEdges,
    HeaderFill,
    HeaderFit,
    HeaderFocus,
    HeaderFormat,
    HeaderLayout,
    HeaderPalette,
    HeaderShape,
    HeaderSide,
    HeaderSpecs,
    HeaderText,
    HeaderVertical,
    headerDirective,
    normalizeHeaderActionAttrs,
    normalizeHeaderAttrs,
    normalizeHeaderImageAttrs,
    normalizeHeaderTitleLevel,
    serializeHeaderAttrs,
} from './HeaderSpecs';

const {markupParser: parser, serializer} = new ExtensionsManager({
    extensions: (builder) => {
        builder.context.set('directiveSyntax', new DirectiveContext(undefined));
        builder.use(FullSpecsPreset, {color: {}}).use(HeaderSpecs);
    },
}).buildDeps();

const md = new MarkdownIt().use(headerDirective);
const render = (...lines: string[]) => md.render(lines.join('\n'));

const catalogue = getHeaderExamples('cover.png', 'landscape.jpg');
const examples = Object.entries(catalogue).flatMap(([group, items]) =>
    Object.entries(items).map(([name, markup]) => ({name: `${group} / ${name}`, markup})),
);

describe('Header examples', () => {
    it('should keep the groups in the catalogue order', () => {
        expect(Object.keys(catalogue)).toEqual([
            'Alignment',
            'Height',
            'Width',
            'Border',
            'Fill',
            'Background image',
            'Decor layer',
            'Text color',
            'Content image',
            'Title',
            'Content',
            'Actions',
            'Combinations',
            'Edge cases',
        ]);
    });

    it('should use no data: addresses for images', () => {
        expect(examples.filter(({markup}) => markup.includes('data:'))).toEqual([]);
    });

    const rendered = examples.map(({markup}) => ({markup, html: render(markup)}));
    const values = (attr: string, list: Record<string, string>) =>
        Object.values(list).map((value) => ({attr, value}));

    it.each([
        ...values('format', HeaderFormat),
        ...values('edges', HeaderEdges),
        ...values('fixed', {True: 'true', False: 'false'}),
        ...values('align', HeaderAlign),
        ...values('vertical', HeaderVertical),
        ...values('border', HeaderBorder),
        // `bg="fill"` — значение по умолчанию, отдельного примера у него нет.
        ...values('bg', {Image: 'image'}),
        ...values('layout', HeaderLayout),
        ...values('fit', HeaderFit),
        ...values('focus', HeaderFocus),
        ...values('fill', HeaderFill),
        ...values('fill2', HeaderPalette),
        ...values('decor', HeaderDecor),
        ...values('direction', HeaderDirection),
        ...values('shape', HeaderShape),
        ...values('text', HeaderText),
        ...values('side', HeaderSide),
        ...values('type', {Button: 'button', Link: 'link'}),
        ...values('color', HeaderFill),
    ])('should show $attr="$value" in the catalogue', ({attr, value}) => {
        // Корень выводит все нормализованные значения, поэтому HTML проверяется только там, где значение задано явно.
        const explicit = rendered.filter(({markup}) => markup.includes(`${attr}="${value}"`));
        expect(explicit.length).toBeGreaterThan(0);
        expect(explicit.some(({html}) => html.includes(`data-${attr}="${value}"`))).toBe(true);
    });

    const order: string[] = Object.values(HeaderAttr);
    const attrNames = (markup: string) =>
        Array.from(markup.matchAll(/^:::header\{(.*)\}$/gm), ([, attrs]) =>
            Array.from(attrs.matchAll(/([\w-]+)="(?:[^"\\]|\\.)*"/g), ([, name]) => name).filter(
                (name) => order.includes(name),
            ),
        );

    it.each(examples)('should keep the serialization order in "$name"', ({markup}) => {
        for (const names of attrNames(markup)) {
            const sorted = [...names].sort((a, b) => order.indexOf(a) - order.indexOf(b));
            expect(names).toEqual(sorted);
        }
    });
});

describe('Header markup stub', () => {
    it.each(examples)('should restore "$name" byte for byte', ({markup}) => {
        expect(serializer.serialize(parser.parse(markup))).toBe(markup);
    });

    it('should parse a cover into one atomic node with its source markup', () => {
        const markup = [
            ':::header[Title]{h="2" bg="/cover.png" fill="blue-light"}',
            '',
            'Text',
            '',
            '::image[Picture](/picture.png)',
            '',
            '::action[Go](/go)',
            '',
            ':::',
        ].join('\n');
        const doc = parser.parse(`${markup}\n\nAfter`);

        expect(doc.childCount).toBe(2);
        expect(doc.firstChild?.type.name).toBe('header');
        expect(doc.firstChild?.isAtom).toBe(true);
        expect(doc.firstChild?.attrs.markup).toBe(markup);
        expect(doc.lastChild?.textContent).toBe('After');
    });

    it('should keep block directives outside a cover as markup', () => {
        const doc = parser.parse('::action[More](/more)\n\n::image[Lost](/lost.png)');

        expect(doc.childCount).toBe(2);
        expect(doc.firstChild?.attrs.markup).toBe('::action[More](/more)');
        expect(doc.lastChild?.attrs.markup).toBe('::image[Lost](/lost.png)');
    });

    it.each([
        ['list', '- Item\n\n  :::header[Title]\n\n  Text\n\n  :::\n\n- Next'],
        ['quote', '> Quote\n>\n> :::header[Title]\n>\n> Text\n>\n> :::'],
    ])('should restore a cover inside a %s', (_name, markup) => {
        expect(serializer.serialize(parser.parse(markup))).toBe(markup);
    });
});

describe('Header preview', () => {
    it('should render parts in a fixed order regardless of their order in the body', () => {
        const html = render(
            ':::header[Title]',
            '',
            '::action[Go](/go)',
            '',
            '::image[Picture](/picture.png)',
            '',
            'Body',
            '',
            ':::',
        );
        const order = [
            'g-md-header__text',
            'g-md-header__title',
            'g-md-header__body',
            'g-md-header__actions',
            'g-md-header__media',
        ].map((name) => html.indexOf(`class="${name}"`));

        expect(order.every((index) => index >= 0)).toBe(true);
        expect([...order].sort((a, b) => a - b)).toEqual(order);
    });

    it('should keep the order of content blocks around directives', () => {
        const html = render(
            ':::header',
            '',
            'One',
            '',
            '::action[Go](/go)',
            '',
            '> Two',
            '',
            '::image[Picture](/picture.png)',
            '',
            'Three',
            '',
            ':::',
        );

        expect(html).toContain(
            '<div class="g-md-header__body">\n<p>One</p>\n<blockquote>\n<p>Two</p>\n</blockquote>\n<p>Three</p>\n</div>',
        );
    });

    it('should render the title as a heading of the given level', () => {
        expect(render(':::header[Title]{h="3"}', '', ':::')).toContain(
            '<h3 class="g-md-header__title">Title</h3>',
        );
        expect(render(':::header[Title]{h="9"}', '', ':::')).toContain(
            '<h1 class="g-md-header__title">Title</h1>',
        );
        expect(render(':::header[Title]{h="2"}', '', ':::')).not.toContain('data-h');
    });

    it('should keep the title as plain text', () => {
        expect(render(':::header[**A** &amp; \\[B\\]]', '', ':::')).toContain(
            '>**A** &amp; [B]</h1>',
        );
    });

    it('should keep only the first content image', () => {
        const html = render(
            ':::header',
            '',
            '::image[First](/first.png)',
            '',
            '::image[Second](/second.png)',
            '',
            ':::',
        );

        expect(html).toContain('alt="First"');
        expect(html).not.toContain('Second');
    });

    it('should drop unsupported content blocks and marks', () => {
        const html = render(
            ':::header',
            '',
            '## Heading',
            '',
            '**Bold** ~~strike~~ [link](/link) `code` ![image](/image.png)',
            '',
            '- Item',
            '',
            '> Quote',
            '',
            '| A | B |',
            '| - | - |',
            '| 1 | 2 |',
            '',
            '```',
            'code block',
            '```',
            '',
            '---',
            '',
            '> ::action[Nested](/nested)',
            '',
            ':::',
        );

        expect(html).toContain('<h2>Heading</h2>');
        expect(html).toContain('<strong>Bold</strong> <s>strike</s> <a href="/link">link</a>');
        expect(html).toContain('<code>code</code>');
        expect(html).toContain('<blockquote>');
        expect(html).not.toContain('Item');
        expect(html).not.toContain('<img');
        expect(html).not.toContain('<table');
        expect(html).not.toContain('<pre');
        expect(html).not.toContain('<hr');
        expect(html).not.toContain('Nested');
    });

    it.each([
        ['bulleted', '- First\n- Second', '> - Nested'],
        ['numbered', '1. First\n2. Second', '> 1. Nested'],
    ])('should drop a %s list', (_name, list, nested) => {
        const html = render(':::header', '', 'Text', '', list, '', nested, '', ':::');

        expect(html).toContain('<div class="g-md-header__body">\n<p>Text</p>\n</div>');
        expect(html).not.toMatch(/<(ul|ol|li|blockquote)/);
        expect(html).not.toMatch(/First|Second|Nested/);
    });

    it('should keep at most three actions', () => {
        const html = render(
            ':::header',
            '',
            '::action[One](/1){type="link" color="green"}',
            '',
            'Text between actions',
            '',
            '::action[Two](/2)',
            '',
            '::action[Three](/3)',
            '',
            '::action[Four](/4)',
            '',
            ':::',
        );

        expect(html.match(/class="g-md-header__action"/g)).toHaveLength(3);
        expect(html).toContain(
            '<a class="g-md-header__action" href="/1" data-type="link" data-color="green">One</a>',
        );
        expect(html).not.toContain('Four');
        expect(html).toContain('<p>Text between actions</p>');
    });

    it('should render a background image and a content image together', () => {
        const html = render(
            ':::header{bg="/background.png" decor="darken"}',
            '',
            '::image[Picture](/picture.png){side="left" fit="whole" focus="top"}',
            '',
            ':::',
        );

        expect(html).toContain('data-bg="image"');
        expect(html).toContain('data-image="/background.png"');
        expect(html).toContain('style="--g-md-header-image:url(&quot;/background.png&quot;)"');
        expect(html).toContain(
            '<div class="g-md-header__media" data-side="left" data-fit="whole" data-focus="top"><img class="g-md-header__image" src="/picture.png" alt="Picture" /></div>',
        );
    });

    it('should treat bg="fill" as the fill and any other value as an image address', () => {
        const fill = render(':::header{bg="fill"}', '', ':::');
        const misspelled = render(':::header{bg="fil"}', '', ':::');

        expect(fill).toContain('data-bg="fill"');
        expect(fill).not.toContain('data-image');
        expect(misspelled).toContain('data-bg="image"');
        expect(misspelled).toContain('data-image="fil"');
    });

    it('should replace unknown values and drop unknown parameters', () => {
        const html = render(
            ':::header{format="huge" fill="indigo" decor="effect" layer="left" image="/image.png"}',
            '',
            '::image[Picture](/picture.png){side="top"}',
            '',
            ':::',
        );

        expect(html).toContain('data-format="medium"');
        expect(html).toContain('data-bg="fill"');
        expect(html).toContain('data-fill="system"');
        expect(html).toContain('data-decor="none"');
        expect(html).not.toMatch(/data-(layer|image)/);
        expect(html).toContain('data-side="right"');
    });

    it('should not render block directives outside a cover', () => {
        const html = render(
            'Before',
            '',
            '::image[Picture](/picture.png)',
            '',
            '::action[Go](/go)',
            '',
            'After',
        );

        expect(html).toBe('<p>Before</p>\n<p>After</p>\n');
    });

    it('should omit empty parts', () => {
        const html = render(':::header[]', '', '::image[Picture]()', '', ':::');

        expect(html).toContain('<div class="g-md-header__text"></div>');
        expect(html).not.toMatch(/g-md-header__(title|body|actions|media)/);
    });

    it('should reject unsafe addresses', () => {
        const unsafe = ['java', 'script:alert(1)'].join('');
        const html = render(
            `:::header{bg="${unsafe}"}`,
            '',
            `::image[Picture](${unsafe})`,
            '',
            `::action[Go](${unsafe})`,
            '',
            ':::',
        );

        expect(html).not.toContain(unsafe);
        expect(html).not.toContain('g-md-header__media');
        expect(html).toContain('href=""');
    });
});

describe('Header parameters', () => {
    it('should fill in defaults for missing and unknown values', () => {
        expect(normalizeHeaderAttrs({format: 'small', fill: 'sky', title: 'false'})).toEqual({
            format: 'small',
            edges: 'rounded',
            fixed: 'true',
            align: 'left',
            vertical: 'center',
            border: 'none',
            bg: 'fill',
            image: '',
            layout: 'cover',
            fit: 'crop',
            focus: 'center',
            fill: 'system',
            fill2: 'blue',
            decor: 'none',
            direction: 'diagonal',
            shape: 'diagonal',
            text: 'system',
        });
    });

    it.each([
        ['fill', ['indigo', 'violet', 'teal', 'sky', 'light-blue', 'amber', 'sand', 'navy']],
        ['fill2', ['system', 'sky']],
        ['text', ['auto', 'light', 'dark', 'primary', 'brand', 'blue-light', 'yellow-light']],
        ['layout', ['full', 'left', 'right', 'tile']],
        ['decor', ['fade', 'blobs', 'pattern']],
    ])('should replace removed values of %s with the default', (attr, removed) => {
        const key = attr as keyof HeaderAttrs;
        const defaults = normalizeHeaderAttrs({bg: '/a.png'});
        for (const value of removed) {
            expect(normalizeHeaderAttrs({bg: '/a.png', [key]: value})[key]).toBe(defaults[key]);
        }
    });

    it('should drop the removed scale parameter', () => {
        expect(normalizeHeaderAttrs({scale: 'large'})).not.toHaveProperty('scale');
        expect(serializeHeaderAttrs({fill: 'blue', scale: 'large'})).toBe('{fill="blue"}');
    });

    it('should accept every color of the table cell palette', () => {
        const palette = [
            'grey',
            'yellow-light',
            'yellow',
            'red-light',
            'red',
            'purple-light',
            'purple',
            'blue-light',
            'blue',
            'green-light',
            'green',
        ];
        for (const color of palette) {
            expect(normalizeHeaderAttrs({fill: color, fill2: color})).toMatchObject({
                fill: color,
                fill2: color,
            });
            expect(normalizeHeaderActionAttrs({color}).color).toBe(color);
        }
    });

    it('should read a background image address from bg', () => {
        expect(normalizeHeaderAttrs({bg: ' /cover.png '})).toMatchObject({
            bg: 'image',
            image: '/cover.png',
        });
        expect(normalizeHeaderAttrs({bg: 'fill', image: '/cover.png'})).toMatchObject({
            bg: 'fill',
            image: '',
        });
        expect(normalizeHeaderAttrs({bg: ' '})).toMatchObject({bg: 'fill', image: ''});
    });

    it.each(['surface', 'shapes', 'gradient', 'mesh', 'pattern', 'image'])(
        'should read the removed background name bg="%s" as an image address',
        (bg) => {
            expect(normalizeHeaderAttrs({bg})).toMatchObject({bg: 'image', image: bg});
        },
    );

    it('should serialize only applicable parameters with non-default values', () => {
        expect(
            serializeHeaderAttrs({
                fill: 'blue-light',
                fill2: 'red',
                image: '/a.png',
                layout: 'object',
                direction: 'down',
                shape: 'corner',
                fit: 'whole',
                text: 'blue',
            }),
        ).toBe('{fill="blue-light" text="blue"}');
        expect(
            serializeHeaderAttrs({
                bg: ' /photo.jpg ',
                layout: 'object',
                fit: 'whole',
                focus: 'top',
            }),
        ).toBe('{bg="/photo.jpg" layout="object" fit="whole" focus="top"}');
        expect(
            serializeHeaderAttrs({
                bg: '/a.png',
                fill2: 'red',
                decor: 'gradient',
                direction: 'down',
                shape: 'corner',
            }),
        ).toBe('{bg="/a.png" fill2="red" decor="gradient" direction="down"}');
        expect(serializeHeaderAttrs({decor: 'mesh', shape: 'edges', direction: 'down'})).toBe(
            '{decor="mesh" shape="edges"}',
        );
    });

    it('should print the title level first and the geometry parameters in model order', () => {
        expect(
            serializeHeaderAttrs({
                border: 'dashed',
                vertical: 'top',
                align: 'right',
                fixed: 'false',
                edges: 'bleed',
                format: 'large',
                h: '3',
            }),
        ).toBe(
            '{h="3" format="large" edges="bleed" fixed="false" align="right" vertical="top" border="dashed"}',
        );
    });

    it('should print nothing for a block with default parameters', () => {
        expect(serializeHeaderAttrs({})).toBe('');
        expect(
            serializeHeaderAttrs({
                h: '1',
                bg: 'fill',
                fill: 'system',
                text: 'system',
                decor: 'none',
            }),
        ).toBe('');
    });

    it('should escape quotes in values', () => {
        expect(serializeHeaderAttrs({bg: '/a"b.png'})).toBe('{bg="/a\\"b.png"}');
    });

    it('should normalize the title level and directive parameters', () => {
        expect(normalizeHeaderTitleLevel({h: '6'})).toBe(6);
        expect(normalizeHeaderTitleLevel({h: '0'})).toBe(1);
        expect(normalizeHeaderTitleLevel({size: '3'})).toBe(1);
        expect(normalizeHeaderImageAttrs({side: 'left', fit: 'cover', focus: 'top-left'})).toEqual({
            side: 'left',
            fit: 'crop',
            focus: 'top-left',
        });
        expect(normalizeHeaderActionAttrs({type: 'link', color: 'brand'})).toEqual({
            type: 'link',
            color: 'system',
        });
    });
});
