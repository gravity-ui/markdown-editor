// @vitest-environment jsdom
import {ExtensionsManager} from '@gravity-ui/markdown-editor/core';
import {ReactRenderStorage, ReactRendererExtension} from '@gravity-ui/markdown-editor/extensions';
import {DOMParser, DOMSerializer} from '@gravity-ui/markdown-editor/pm/model';
import {BaseSchemaSpecs, ListsSpecs} from '@gravity-ui/markdown-editor/specs';
import {describe, expect, it} from 'vitest';

import {ButtonSpecs} from '../Button/ButtonSpecs';
import {Header} from '../Header';
import {HeaderSpecs} from '../Header/HeaderSpecs';
import {HeaderContentSpecs} from '../HeaderContent/HeaderContentSpecs';
import {HeaderTitleSpecs} from '../HeaderTitle/HeaderTitleSpecs';

import {HeaderImageSpecs, headerImageNodeName, headerImageNodeType} from './HeaderImageSpecs';

const {schema, markupParser, serializer} = new ExtensionsManager({
    extensions: (builder) =>
        builder
            .use(BaseSchemaSpecs, {})
            .use(ListsSpecs)
            .use(HeaderSpecs)
            .use(HeaderTitleSpecs)
            .use(HeaderContentSpecs)
            .use(HeaderImageSpecs)
            .use(ButtonSpecs),
}).buildDeps();

const roundTrip = (markup: string) => serializer.serialize(markupParser.parse(markup));
const inHeader = (content: string) => `:::header{height="s" width="m"}\n\n${content}\n\n:::`;
// Built at runtime for the `no-script-url` lint rule.
const scriptUrl = ['javascript', 'alert(1)'].join(':');

describe('Header image extension', () => {
    it('should parse the image as a block without content with its attributes', () => {
        const doc = markupParser.parse(
            '::header-image{src="https://example.org/banner.jpg" alt="Team" title="Project team"}',
        );
        expect(doc.childCount).toBe(1);
        const image = doc.child(0);
        expect(image.type).toBe(headerImageNodeType(schema));
        expect(image.type.name).toBe(headerImageNodeName);
        expect(image.attrs).toEqual({
            src: 'https://example.org/banner.jpg',
            alt: 'Team',
            title: 'Project team',
        });
        expect(image.childCount).toBe(0);
        expect(image.isAtom).toBe(true);
        expect(image.isBlock).toBe(true);
    });

    it('should use the same defaults in the schema and parser', () => {
        const defaults = {src: null, alt: '', title: null};
        expect(headerImageNodeType(schema).create().attrs).toEqual(defaults);
        expect(markupParser.parse('::header-image').child(0).attrs).toEqual(defaults);
    });

    // image-001 … image-012 of the syntax examples.
    it.each(
        [
            'https://example.org/image.jpg',
            'http://example.org/image.jpg',
            'https://example.org/banner.jpg',
        ].flatMap((src) =>
            [false, true].flatMap((alt) => [false, true].map((title) => ({src, alt, title}))),
        ),
    )('should round trip the image $src with alt $alt and title $title', ({src, alt, title}) => {
        const markup = inHeader(
            `::header-image{src="${src}"${alt ? ' alt="Team"' : ''}${title ? ' title="Project team"' : ''}}\n\n::header-title[Team portal]`,
        );
        expect(roundTrip(markup)).toBe(markup);
    });

    // image-013 … image-015: an empty value is the default and is not written.
    it.each([
        ['::header-image{src="/image.jpg" alt=""}', '::header-image{src="/image.jpg"}'],
        ['::header-image{src="/image.jpg" title=""}', '::header-image{src="/image.jpg"}'],
        ['::header-image{src="/image.jpg" alt="" title=""}', '::header-image{src="/image.jpg"}'],
        [
            '::header-image{title="Project team" alt="Team" src="/image.jpg"}',
            '::header-image{src="/image.jpg" alt="Team" title="Project team"}',
        ],
        [
            "::header-image{src='/image.jpg' alt=Team}",
            '::header-image{src="/image.jpg" alt="Team"}',
        ],
        [
            '::header-image{src="  /image.jpg  " unknown="value" .custom}',
            '::header-image{src="/image.jpg"}',
        ],
        [
            '::header-image{src="/image.jpg" alt="Team" alt="Other"}',
            '::header-image{src="/image.jpg"}',
        ],
    ])('should write %j in the normal form', (markup, serialized) => {
        expect(roundTrip(markup)).toBe(serialized);
        expect(roundTrip(serialized)).toBe(serialized);
    });

    it.each([
        '::header-image{src="/image?a=1&copy=2&amp;b=3"}',
        '::header-image{src="/image&#10;.jpg" alt="Q&amp;A &copy; &lt;b&gt;"}',
        '::header-image{src="/a\\"b\\\\c.jpg" alt="A \\"quote\\" and a \\\\ backslash"}',
        '::header-image{src="./.files/photo 1 (final).jpg" title="<b>bold</b> **bold** {braces} [brackets]"}',
        '::header-image{src="blob:https://example.org/0a1b2c3d" alt="Команда проекта 🚀"}',
    ])('should keep the values of %j as written', (markup) => {
        const doc = markupParser.parse(markup);
        expect(doc.child(0).type.name).toBe(headerImageNodeName);
        expect(roundTrip(markup)).toBe(markup);
        expect(markupParser.parse(roundTrip(markup)).toJSON()).toEqual(doc.toJSON());
    });

    it.each([
        [`::header-image{src="${scriptUrl}" alt="Team"}`, '::header-image{alt="Team"}'],
        ['::header-image{src="data:image/png;base64,AAAA"}', '::header-image'],
        ['::header-image{src="/image.jpg" src="/other.jpg"}', '::header-image'],
        ['::header-image{}', '::header-image'],
        ['::header-image', '::header-image'],
    ])('should keep the image of %j without an address', (markup, serialized) => {
        const doc = markupParser.parse(markup);
        expect(doc.child(0).type.name).toBe(headerImageNodeName);
        expect(doc.child(0).attrs.src).toBeNull();
        expect(serializer.serialize(doc)).toBe(serialized);
        expect(markupParser.parse(serialized).toJSON()).toEqual(doc.toJSON());
    });

    it.each([
        ':::header{height="s" width="m"}\n\n::header-image{src="/image.jpg" alt="Team"}\n\n::header-title[Team portal]\n\n:::header-content\n\nPortal description.\n\n:::\n\n:button[Open]{href="/page" view="action" color="blue"}\n\n:::',
        ':::header{height="s" width="m"}\n\n::header-image{src="/image.jpg"}\n\n:::',
        ':::header{height="s" width="m" align="right"}\n\n::header-title[Team portal]\n\n::header-image{src="/image.jpg"}\n\n:::',
        ':::header{height="s" width="m"}\n\n::header-image{src="/first.jpg"}\n\n::header-image{src="/second.jpg"}\n\n:::',
        'Before\n\n::header-image{src="/image.jpg" alt="Outside a header"}\n\nAfter',
        '- ::header-image{src="/image.jpg" alt="In a list"}',
    ])('should round trip the image among other blocks in %j', (markup) => {
        const doc = markupParser.parse(markup);
        let images = 0;
        doc.descendants((node) => {
            if (node.type.name === headerImageNodeName) images++;
        });
        expect(images).toBe(markup.match(/::header-image/g)?.length);
        expect(serializer.serialize(doc)).toBe(markup);
    });

    it('should leave an image with a text in brackets as a paragraph', () => {
        expect(
            markupParser.parse('::header-image[Team]{src="/image.jpg"}').child(0).type.name,
        ).toBe('paragraph');
    });

    it('should render the element of the view mode and read it back', () => {
        const doc = markupParser.parse(
            '::header-image{src="/image.jpg" alt="Team" title="Project team"}',
        );
        const dom = DOMSerializer.fromSchema(schema).serializeNode(doc.child(0)) as HTMLElement;
        expect(dom.outerHTML).toBe(
            '<img class="g-md-header-image-plugin" data-files-gallery-exclude="true" src="/image.jpg" alt="Team" title="Project team">',
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
        const markup = inHeader(
            '::header-image{src="/image.jpg" alt="Team"}\n\n::header-title[Team portal]',
        );
        const doc = deps.markupParser.parse(markup);
        expect(doc.child(0).child(0).type.name).toBe(headerImageNodeName);
        expect(deps.serializer.serialize(doc)).toBe(markup);
    });
});
