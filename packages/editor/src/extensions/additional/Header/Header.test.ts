import transform from '@diplodoc/transform';
import MarkdownIt from 'markdown-it';
import {describe, expect, it} from 'vitest';

import {DOMParser} from '#pm/model';

import {ExtensionsManager} from '../../../core';
import color from '../../../markdown-it/color';
import {FullSpecsPreset} from '../../../presets/full-specs';
import {ButtonSpecs} from '../Button/ButtonSpecs';

import {HeaderSpecs, headerDirective} from './HeaderSpecs';

const {
    schema,
    markupParser: parser,
    serializer,
} = new ExtensionsManager({
    extensions: (builder) =>
        builder.use(FullSpecsPreset, {color: {}}).use(HeaderSpecs, {}).use(ButtonSpecs),
}).buildDeps();
const slot = (name: string, body: string, attrs = '') =>
    `:::${name}${attrs ? `{${attrs}}` : ''}\n${body}\n:::`;
const cover = (body = '', attrs = '') => slot('header', body, attrs);
const full = (attrs = '') =>
    cover(
        [
            slot('header-image', '', 'src="https://example.com/content.png" alt="Content"'),
            slot('header-title', 'Title **literal** &amp; text'),
            slot('header-content', 'First **bold** paragraph.\n\nSecond {red}(red) [link](/page).'),
            slot('button', 'Open', 'href="/page"'),
            slot('button', 'Hidden', 'enabled="false" view="outlined" color="red" new-tab="true"'),
        ].join('\n\n'),
        attrs,
    );
const json = (doc: {toJSON: () => unknown}) =>
    JSON.parse(
        JSON.stringify(doc.toJSON(), (key, value) => (key === 'data-markup' ? undefined : value)),
    );
const md = new MarkdownIt().use(color).use(headerDirective);
const dom = (html: string) => {
    const element = document.createElement('div');
    element.innerHTML = html;
    return DOMParser.fromSchema(schema).parse(element);
};

function roundTrip(markup: string) {
    const doc = parser.parse(markup);
    const serialized = serializer.serialize(doc);
    expect(parser.parse(serialized).toJSON()).toEqual(doc.toJSON());
    expect(serializer.serialize(parser.parse(serialized))).toBe(serialized);
    expect(json(dom(md.render(markup)))).toEqual(json(doc));
    return doc;
}

describe('Header containers', () => {
    it('should parse and serialize all named containers and independent images', () => {
        const doc = roundTrip(
            full('image="https://example.com/background.png" width="s" height="m"'),
        );
        expect(doc.firstChild?.firstChild?.textContent).toBe('Title **literal** & text');
        expect(doc.firstChild?.child(1).childCount).toBe(2);
        expect(doc.firstChild?.child(2).childCount).toBe(2);
        expect(doc.firstChild?.child(3).attrs.src).toBe('https://example.com/content.png');
        expect(doc.firstChild?.attrs.image).toBe('https://example.com/background.png');
    });
    it('should keep the first container of each type and the first three direct buttons', () => {
        const text = [
            slot('header-title', 'First'),
            slot('header-title', 'Second'),
            slot('header-content', 'First body'),
            slot('header-content', 'Second body'),
            slot('header-image', '', 'src="/first.png"'),
            slot('header-image', '', 'src="/second.png"'),
            ...[1, 2, 3, 4].map((n) => slot('button', String(n))),
            'Ignored paragraph',
            '> ' + slot('button', 'Nested').replace(/\n/g, '\n> '),
        ].join('\n\n');
        const doc = roundTrip(cover(text));
        expect(doc.firstChild?.textContent).toBe('FirstFirst body');
        expect(doc.firstChild?.child(2).childCount).toBe(3);
        expect(doc.firstChild?.child(2).child(2).attrs.label).toBe('3');
        expect(doc.firstChild?.child(3).attrs.src).toBe('/first.png');
        expect(md.render(cover(text))).not.toContain('Nested');
    });
    it('should keep standalone buttons and reject header slots outside their parent', () => {
        const doc = roundTrip(slot('button', 'Standalone', 'href="/page" new-tab="true"'));
        expect(doc.firstChild?.type.name).toBe('button');
        for (const name of ['header-title', 'header-content', 'header-image']) {
            const parsed = parser.parse(slot(name, 'Outside'));
            expect(parsed.firstChild?.type.name).toBe('paragraph');
            expect(md.render(slot(name, 'Outside'))).not.toContain('g-md-header__');
        }
    });
    it('should ignore unsupported direct nodes and filter unsafe content within text', () => {
        const doc = roundTrip(
            cover(
                slot(
                    'header-content',
                    'Paragraph.\n\n# Heading\n\n<script>alert(1)</script>\n\n![Image](/image.png)\n\n' +
                        slot('button', 'Nested button'),
                ),
            ),
        );
        expect(doc.firstChild?.child(2).childCount).toBe(0);
        expect(doc.firstChild?.child(1).textContent).not.toContain('Heading');
        expect(
            md.render(cover(slot('header-content', '<img src=x onerror=alert(1)>'))),
        ).not.toContain('<img src=x');
    });
    it('should normalize unknown and removed attributes without retaining old effects', () => {
        const doc = roundTrip(
            cover(
                '',
                'height="unknown" width="unknown" bg="gradient" fill2="red" effect="fade" layer="tile" scale="large"',
            ),
        );
        expect(doc.firstChild?.attrs).toMatchObject({
            height: 's',
            width: 'm',
            effect: 'none',
            fill: 'none',
            shapes: 'none',
        });
        const serialized = serializer.serialize(doc);
        for (const name of ['gradient', 'fill2', 'layer', 'scale', 'fade'])
            expect(serialized).not.toContain(name);
    });
    it('should preserve hidden content, image settings and escaped literal labels', () => {
        roundTrip(
            full(
                'title="false" description="false" image="/bg.png" image-enabled="false" bg-image-theme="dark"',
            ),
        );
        roundTrip(
            cover(
                slot('header-title', 'First\n&#58;:: literal\nLast &amp; text') +
                    '\n\n' +
                    slot('button', '&#58;:: literal &amp; text'),
            ),
        );
    });
    it.each(['system', 'light', 'dark'])(
        'should preserve the %s image text theme and apply it only to a valid background',
        (theme) => {
            const doc = roundTrip(full(`image="/background.png" bg-image-theme="${theme}"`));
            expect(doc.firstChild?.attrs['bg-image-theme']).toBe(theme);
            const html = md.render(serializer.serialize(doc));
            expect(html.includes(`g-root_theme_${theme}`)).toBe(theme !== 'system');
            for (const attrs of [
                '',
                'image="javascript:alert(1)"',
                'image="/background.png" image-enabled="false"',
            ])
                expect(md.render(full(`${attrs} bg-image-theme="${theme}"`))).not.toContain(
                    'g-root_theme_',
                );
        },
    );
    it.each(['gray', 'yellow', 'orange', 'red', 'green', 'blue', 'violet'])(
        'should retain the standard %s text color',
        (text) => {
            roundTrip(full(`text="${text}"`));
        },
    );
    it('should retain layout, shapes and palette through the default sanitizer', () => {
        const result = transform(
            full('image="/background.png" effect="blur" shapes="scatter" bg-image-theme="dark"'),
            {plugins: [headerDirective], needToSanitizeHtml: true},
        ).result.html;
        expect(result).toContain('g-root_theme_dark');
        expect(result).toContain('--g-md-header-shape-x:');
        expect(result).toContain('data-effect="blur"');
        expect(result).toContain('rel="noopener noreferrer"');
        expect(result).not.toContain('contenteditable');
    });
    it.each([
        ['javascript', 'alert(1)'].join(':'),
        ['JaVaScRiPt', 'alert(1)'].join(':'),
        'java\nscript:alert(1)',
        'data:text/html,test',
        'file:///tmp/test',
    ])('should reject unsafe links and image URLs including %s', (url) => {
        const button = schema.nodes.button.create({label: 'Unsafe', href: url});
        expect(
            md.render(serializer.serialize(schema.nodes.doc.create(null, button))),
        ).not.toContain('href="' + url + '"');
        const html = md.render(
            cover(slot('header-image', '', `src="${url}"`), `image="${url}" bg-image-theme="dark"`),
        );
        expect(html).not.toContain('--g-md-header-image:');
        expect(html).not.toContain('g-root_theme_dark');
    });
    it('should preserve literal backslashes when titles and button labels are edited', () => {
        const value = String.raw`Literal \[brackets] & text`;
        const original = parser.parse(full()).firstChild!;
        const title = original.child(0).type.create(null, schema.text(value));
        const buttons = original
            .child(2)
            .type.create(null, schema.nodes.button.create({label: value}));
        const node = original.type.create(original.attrs, [
            title,
            original.child(1),
            buttons,
            original.child(3),
        ]);
        const doc = schema.nodes.doc.create(null, node);
        expect(parser.parse(serializer.serialize(doc)).toJSON()).toEqual(doc.toJSON());
    });
    it('should retain a cover nested inside a quote and a list', () => {
        for (const markup of [
            full()
                .split('\n')
                .map((line) => '> ' + line)
                .join('\n'),
            '- ' + full().split('\n').join('\n  '),
        ]) {
            const doc = parser.parse(markup);
            expect(parser.parse(serializer.serialize(doc)).toJSON()).toEqual(doc.toJSON());
        }
    });
});
