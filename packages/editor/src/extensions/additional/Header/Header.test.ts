import MarkdownIt from 'markdown-it';
import {describe, expect, it} from 'vitest';

import {getHeaderExamples} from '../../../../../../demo/src/stories/examples/header/markup';
import {DirectiveContext} from '../../../../tests/utils';
import {ExtensionsManager} from '../../../core';
import {FullSpecsPreset} from '../../../presets/full-specs';

import {
    HeaderSpecs,
    headerDirective,
    normalizeHeaderActionAttrs,
    normalizeHeaderAttrs,
    normalizeHeaderImageAttrs,
    normalizeHeaderTitleSize,
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

const examples = Object.entries(getHeaderExamples('cover.png')).flatMap(([group, items]) =>
    Object.entries(items).map(([name, markup]) => ({name: `${group} / ${name}`, markup})),
);

describe('Header markup stub', () => {
    it('should cover between 30 and 45 examples', () => {
        expect(examples.length).toBeGreaterThanOrEqual(30);
        expect(examples.length).toBeLessThanOrEqual(45);
    });

    it.each(examples)('should restore "$name" byte for byte', ({markup}) => {
        expect(serializer.serialize(parser.parse(markup))).toBe(markup);
    });

    it('should parse a cover into one atomic node with its source markup', () => {
        const markup = [
            ':::header{fill="sky"}',
            '',
            '::header-title[Title]',
            '',
            ':::header-content',
            '',
            'Text',
            '',
            ':::',
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

    it('should keep slot directives outside a cover as markup', () => {
        const doc = parser.parse('::action[More](/more)\n\n::header-title[Lost]');

        expect(doc.childCount).toBe(2);
        expect(doc.firstChild?.attrs.markup).toBe('::action[More](/more)');
        expect(doc.lastChild?.attrs.markup).toBe('::header-title[Lost]');
    });

    it.each([
        ['list', '- Item\n\n  :::header\n\n  ::header-title[Title]\n\n  :::\n\n- Next'],
        ['quote', '> Quote\n>\n> :::header\n>\n> ::header-title[Title]\n>\n> :::'],
    ])('should restore a cover inside a %s', (_name, markup) => {
        expect(serializer.serialize(parser.parse(markup))).toBe(markup);
    });
});

describe('Header preview', () => {
    it('should render slots in a fixed order regardless of their order in markup', () => {
        const html = render(
            ':::header',
            '',
            ':::header-actions',
            '',
            '::action[Go](/go)',
            '',
            ':::',
            '',
            '::header-image[Picture](/picture.png)',
            '',
            ':::header-content',
            '',
            'Body',
            '',
            ':::',
            '',
            '::header-title[Title]',
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

    it('should render the title as a heading of the given level', () => {
        expect(render(':::header', '', '::header-title[Title]{size="3"}', '', ':::')).toContain(
            '<h3 class="g-md-header__title">Title</h3>',
        );
        expect(render(':::header', '', '::header-title[Title]{size="9"}', '', ':::')).toContain(
            '<h1 class="g-md-header__title">Title</h1>',
        );
    });

    it('should keep the title as plain text', () => {
        expect(render(':::header', '', '::header-title[**A** &amp; \\[B\\]]', '', ':::')).toContain(
            '>**A** &amp; [B]</h1>',
        );
    });

    it('should keep only the first slot of each name', () => {
        const html = render(
            ':::header',
            '',
            '::header-title[First]',
            '',
            '::header-title[Second]',
            '',
            ':::header-content',
            '',
            'One',
            '',
            ':::',
            '',
            ':::header-content',
            '',
            'Two',
            '',
            ':::',
            '',
            ':::',
        );

        expect(html).toContain('First');
        expect(html).not.toContain('Second');
        expect(html).toContain('One');
        expect(html).not.toContain('Two');
    });

    it('should drop unsupported content blocks and marks', () => {
        const html = render(
            ':::header',
            '',
            ':::header-content',
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
            ':::',
            '',
            'Outside a slot',
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
        expect(html).not.toContain('Outside a slot');
    });

    it.each([
        ['bulleted', '- First\n- Second', '> - Nested'],
        ['numbered', '1. First\n2. Second', '> 1. Nested'],
    ])('should drop a %s list', (_name, list, nested) => {
        const html = render(
            ':::header',
            '',
            ':::header-content',
            '',
            'Text',
            '',
            list,
            '',
            nested,
            '',
            ':::',
            '',
            ':::',
        );

        expect(html).toContain('<div class="g-md-header__body">\n<p>Text</p>\n</div>');
        expect(html).not.toMatch(/<(ul|ol|li|blockquote)/);
        expect(html).not.toMatch(/First|Second|Nested/);
    });

    it('should keep at most three actions', () => {
        const html = render(
            ':::header',
            '',
            ':::header-actions',
            '',
            '::action[One](/1){type="link" color="brand"}',
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
            '',
            ':::',
        );

        expect(html.match(/class="g-md-header__action"/g)).toHaveLength(3);
        expect(html).toContain(
            '<a class="g-md-header__action" href="/1" data-type="link" data-color="brand">One</a>',
        );
        expect(html).not.toContain('Four');
        expect(html).not.toContain('Text between actions');
    });

    it('should render a background image and a content image together', () => {
        const html = render(
            ':::header{image="/background.png" effect="darken"}',
            '',
            '::header-image[Picture](/picture.png){side="left" fit="whole" focus="top"}',
            '',
            ':::',
        );

        expect(html).toContain('data-image="/background.png"');
        expect(html).toContain('style="--g-md-header-image:url(&quot;/background.png&quot;)"');
        expect(html).toContain(
            '<div class="g-md-header__media" data-side="left" data-fit="whole" data-focus="top"><img class="g-md-header__image" src="/picture.png" alt="Picture" /></div>',
        );
    });

    it('should replace unknown values and drop unknown parameters', () => {
        const html = render(
            ':::header{format="huge" bg="rainbow" fill="magenta" layer="left" color="red"}',
            '',
            '::header-image[Picture](/picture.png){side="top"}',
            '',
            ':::',
        );

        expect(html).toContain('data-format="medium"');
        expect(html).toContain('data-bg="shapes"');
        expect(html).toContain('data-fill="blue"');
        expect(html).toContain('data-layer="full"');
        expect(html).not.toContain('data-color');
        expect(html).toContain('data-side="right"');
    });

    it('should not render slot directives outside a cover', () => {
        const html = render(
            'Before',
            '',
            '::header-title[Title]',
            '',
            '::header-image[Picture](/picture.png)',
            '',
            '::action[Go](/go)',
            '',
            ':::header-content',
            '',
            'Content',
            '',
            ':::',
            '',
            'After',
        );

        expect(html).toBe('<p>Before</p>\n<p>After</p>\n');
    });

    it('should omit empty slots', () => {
        const html = render(
            ':::header',
            '',
            '::header-title[]',
            '',
            ':::header-content',
            '',
            ':::',
            '',
            ':::header-actions',
            '',
            ':::',
            '',
            '::header-image[Picture]()',
            '',
            ':::',
        );

        expect(html).toContain('<div class="g-md-header__text"></div>');
        expect(html).not.toMatch(/g-md-header__(title|body|actions|media)/);
    });

    it('should reject unsafe addresses', () => {
        const unsafe = ['java', 'script:alert(1)'].join('');
        const html = render(
            `:::header{image="${unsafe}"}`,
            '',
            `::header-image[Picture](${unsafe})`,
            '',
            ':::header-actions',
            '',
            `::action[Go](${unsafe})`,
            '',
            ':::',
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
        expect(normalizeHeaderAttrs({format: 'small', fill: 'magenta', title: 'false'})).toEqual({
            format: 'small',
            align: 'left',
            vertical: 'center',
            fixed: 'true',
            bg: 'shapes',
            fill: 'blue',
            fill2: 'purple',
            direction: 'diagonal',
            shapes: 'diagonal',
            scale: 'medium',
            image: '',
            layer: 'full',
            fit: 'crop',
            focus: 'center',
            effect: 'none',
            text: 'auto',
        });
    });

    it('should serialize only applicable parameters with non-default values', () => {
        expect(
            serializeHeaderAttrs({
                bg: 'fill',
                fill: 'sky',
                fill2: 'red',
                direction: 'down',
                shapes: 'corner',
                fit: 'whole',
                effect: 'blur',
                text: 'dark',
            }),
        ).toBe('{bg="fill" fill="sky" text="dark"}');
        expect(
            serializeHeaderAttrs({
                image: ' /tile.png ',
                layer: 'tile',
                scale: 'large',
                fit: 'whole',
            }),
        ).toBe('{fill="blue" scale="large" image="/tile.png" layer="tile"}');
        expect(
            serializeHeaderAttrs({bg: 'gradient', fill2: 'red', image: '/a.png', effect: 'fade'}),
        ).toBe('{bg="gradient" fill="blue" fill2="red" image="/a.png" effect="fade"}');
    });

    it('should always print the fill color', () => {
        expect(serializeHeaderAttrs({})).toBe('{fill="blue"}');
    });

    it('should escape quotes in values', () => {
        expect(serializeHeaderAttrs({image: '/a"b.png'})).toBe('{fill="blue" image="/a\\"b.png"}');
    });

    it('should normalize slot parameters', () => {
        expect(normalizeHeaderTitleSize({size: '6'})).toBe(6);
        expect(normalizeHeaderTitleSize({size: '0'})).toBe(1);
        expect(normalizeHeaderImageAttrs({side: 'left', fit: 'cover', focus: 'top-left'})).toEqual({
            side: 'left',
            fit: 'crop',
            focus: 'top-left',
        });
        expect(normalizeHeaderActionAttrs({type: 'link', color: 'red'})).toEqual({
            type: 'link',
            color: 'default',
        });
    });
});
