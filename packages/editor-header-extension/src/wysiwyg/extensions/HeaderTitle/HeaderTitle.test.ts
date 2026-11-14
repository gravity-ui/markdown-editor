// @vitest-environment jsdom
import {ExtensionsManager} from '@gravity-ui/markdown-editor/core';
import {ReactRenderStorage, ReactRendererExtension} from '@gravity-ui/markdown-editor/extensions';
import {DOMParser, DOMSerializer, Fragment} from '@gravity-ui/markdown-editor/pm/model';
import {BaseSchemaSpecs, BoldSpecs, ListsSpecs} from '@gravity-ui/markdown-editor/specs';
import {headerTitleColors, headerTitleSizes} from '@gravity-ui/markdown-plugin-header';
import {describe, expect, it} from 'vitest';

import {ButtonSpecs} from '../Button/ButtonSpecs';
import {Header} from '../Header';
import {HeaderSpecs} from '../Header/HeaderSpecs';

import {HeaderTitleSpecs, headerTitleNodeName, headerTitleNodeType} from './HeaderTitleSpecs';

const {schema, markupParser, serializer} = new ExtensionsManager({
    extensions: (builder) =>
        builder
            .use(BaseSchemaSpecs, {})
            .use(BoldSpecs)
            .use(ListsSpecs)
            .use(HeaderSpecs)
            .use(HeaderTitleSpecs)
            .use(ButtonSpecs),
}).buildDeps();

const roundTrip = (markup: string) => serializer.serialize(markupParser.parse(markup));
const inHeader = (content: string) => `:::header{height="s" width="m"}\n\n${content}\n\n:::`;

describe('Header title extension', () => {
    it('should parse the title as a block of plain text with its size and color', () => {
        const doc = markupParser.parse('::header-title[Team portal]{size="1" color="red"}');
        expect(doc.childCount).toBe(1);
        const title = doc.child(0);
        expect(title.type).toBe(headerTitleNodeType(schema));
        expect(title.type.name).toBe(headerTitleNodeName);
        expect(title.attrs).toEqual({size: 1, color: 'red'});
        expect(title.textContent).toBe('Team portal');
        expect(title.childCount).toBe(1);
        expect(title.child(0).marks).toEqual([]);
    });

    it('should use the same defaults in the schema and parser', () => {
        const defaults = {size: 2, color: 'auto'};
        expect(headerTitleNodeType(schema).create().attrs).toEqual(defaults);
        expect(markupParser.parse('::header-title[Team portal]').child(0).attrs).toEqual(defaults);
    });

    // title-001 … title-063 of the syntax examples: the default values are not written.
    it.each(
        (['omitted', ...headerTitleSizes] as const).flatMap((size) =>
            (['omitted', ...headerTitleColors] as const).map((color) => ({size, color})),
        ),
    )('should round trip the title with size $size and color $color', ({size, color}) => {
        const written = [
            size === 'omitted' || size === 2 ? '' : `size="${size}"`,
            color === 'omitted' || color === 'auto' ? '' : `color="${color}"`,
        ]
            .filter(Boolean)
            .join(' ');
        const attrs = [
            size === 'omitted' ? '' : `size="${size}"`,
            color === 'omitted' ? '' : `color="${color}"`,
        ]
            .filter(Boolean)
            .join(' ');
        expect(roundTrip(inHeader(`::header-title[Team portal]${attrs && `{${attrs}}`}`))).toBe(
            inHeader(`::header-title[Team portal]${written && `{${written}}`}`),
        );
    });

    it.each([
        ['::header-title[Team portal]{size="7" color="pink"}', '::header-title[Team portal]'],
        ['::header-title[Team portal]{unknown="value" .custom}', '::header-title[Team portal]'],
        [
            '::header-title[Team portal]{color=red size=3}',
            '::header-title[Team portal]{size="3" color="red"}',
        ],
        ['::header-title[  Team portal  ]', '::header-title[Team portal]'],
    ])('should write %j in the normal form', (markup, serialized) => {
        expect(roundTrip(markup)).toBe(serialized);
    });

    // The text is plain: nothing in it is parsed or escaped except the brackets.
    it.each([
        '::header-title[**bold** *italic* `code` ~~strike~~ ++underline++]',
        '::header-title[# Heading - item 1. item > quote]',
        '::header-title[<b>bold</b> & &amp; &copy; $x$ a_b_c {braces} a|b]',
        '::header-title[a \\] bracket, a \\[ bracket and a \\\\ backslash]',
        '::header-title[Заголовок баннера 🚀]{size="1" color="violet"}',
    ])('should keep the text of %j as written', (markup) => {
        const doc = markupParser.parse(markup);
        expect(doc.child(0).type.name).toBe(headerTitleNodeName);
        expect(doc.child(0).childCount).toBe(1);
        expect(roundTrip(markup)).toBe(markup);
        expect(markupParser.parse(roundTrip(markup)).toJSON()).toEqual(doc.toJSON());
    });

    it.each([
        [
            '::header-title[[link](/page) and ![image](/a.png)]',
            '::header-title[\\[link\\](/page) and !\\[image\\](/a.png)]',
            '[link](/page) and ![image](/a.png)',
        ],
        [
            '::header-title[:button[Open]{href="/page"}]',
            '::header-title[:button\\[Open\\]{href="/page"}]',
            ':button[Open]{href="/page"}',
        ],
    ])('should escape the brackets of the text in %j', (markup, serialized, text) => {
        const doc = markupParser.parse(markup);
        expect(doc.child(0).textContent).toBe(text);
        expect(serializer.serialize(doc)).toBe(serialized);
        expect(markupParser.parse(serialized).toJSON()).toEqual(doc.toJSON());
    });

    it('should keep an empty title', () => {
        const doc = markupParser.parse('::header-title[]{size="1"}');
        expect(doc.child(0).type.name).toBe(headerTitleNodeName);
        expect(doc.child(0).childCount).toBe(0);
        expect(serializer.serialize(doc)).toBe('::header-title[]{size="1"}');
    });

    it.each([
        ':::header\n\n::header-title[Team portal]\n\nPortal description.\n\n:button[Open]{href="/page" view="action" color="blue"}\n\n:::',
        ':::header\n\n::header-title[First]\n\n::header-title[Second]{size="1"}\n\n:::',
        'Before\n\n::header-title[Outside a header]\n\nAfter',
        '- ::header-title[In a list]{color="blue"}',
    ])('should round trip the title among other blocks in %j', (markup) => {
        const doc = markupParser.parse(markup);
        let titles = 0;
        doc.descendants((node) => {
            if (node.type.name === headerTitleNodeName) titles++;
        });
        expect(titles).toBe(markup.match(/::header-title\[/g)?.length);
        expect(markupParser.parse(serializer.serialize(doc)).toJSON()).toEqual(doc.toJSON());
    });

    it('should leave a title without brackets as a paragraph', () => {
        expect(markupParser.parse('::header-title{size="1"}').child(0).type.name).toBe('paragraph');
    });

    it('should reject marks and inline nodes in the content', () => {
        const type = headerTitleNodeType(schema);
        expect(type.spec.marks).toBe('');
        expect(type.allowsMarkType(schema.marks.strong)).toBe(false);
        expect(type.validContent(Fragment.from(schema.text('Title')))).toBe(true);
        expect(type.validContent(Fragment.from(schema.nodes.button.create()))).toBe(false);
    });

    it('should render the element of the view mode and read it back', () => {
        const doc = markupParser.parse('::header-title[Team portal]{size="3" color="green"}');
        const dom = DOMSerializer.fromSchema(schema).serializeNode(doc.child(0)) as HTMLElement;
        expect(dom.outerHTML).toBe(
            '<div class="g-md-header-title-plugin g-md-header-title-plugin_size_3 g-md-header-title-plugin_color_green" role="heading" aria-level="3" data-size="3" data-color="green">Team portal</div>',
        );
        const container = document.createElement('div');
        container.append(dom);
        const parsed = DOMParser.fromSchema(schema).parse(container);
        expect(parsed.child(0).toJSON()).toEqual(doc.child(0).toJSON());
    });

    it('should be part of the header extension', () => {
        const deps = new ExtensionsManager({
            extensions: (builder) =>
                builder
                    .use(BaseSchemaSpecs, {})
                    .use(ReactRendererExtension, new ReactRenderStorage())
                    .use(Header, {}),
        }).buildDeps();
        const markup = inHeader('::header-title[Team portal]{size="1" color="yellow"}');
        const doc = deps.markupParser.parse(markup);
        expect(doc.child(0).child(0).type.name).toBe(headerTitleNodeName);
        expect(deps.serializer.serialize(doc)).toBe(markup);
    });
});
