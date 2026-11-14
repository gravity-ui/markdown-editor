// @vitest-environment jsdom
import {ExtensionsManager} from '@gravity-ui/markdown-editor/core';
import {ReactRenderStorage, ReactRendererExtension} from '@gravity-ui/markdown-editor/extensions';
import {DOMParser, DOMSerializer} from '@gravity-ui/markdown-editor/pm/model';
import {
    BaseSchemaSpecs,
    BoldSpecs,
    CodeSpecs,
    ItalicSpecs,
    LinkSpecs,
    ListsSpecs,
    StrikeSpecs,
    UnderlineSpecs,
} from '@gravity-ui/markdown-editor/specs';
import {headerContentSizes} from '@gravity-ui/markdown-plugin-header';
import {describe, expect, it} from 'vitest';

import {ButtonSpecs} from '../Button/ButtonSpecs';
import {Header} from '../Header';
import {HeaderSpecs} from '../Header/HeaderSpecs';
import {HeaderTitleSpecs} from '../HeaderTitle/HeaderTitleSpecs';

import {
    HeaderContentSpecs,
    headerContentNodeName,
    headerContentNodeType,
} from './HeaderContentSpecs';

const {schema, markupParser, serializer} = new ExtensionsManager({
    extensions: (builder) =>
        builder
            .use(BaseSchemaSpecs, {})
            .use(BoldSpecs)
            .use(ItalicSpecs)
            .use(UnderlineSpecs)
            .use(StrikeSpecs)
            .use(CodeSpecs)
            .use(LinkSpecs)
            .use(ListsSpecs)
            .use(HeaderSpecs)
            .use(HeaderTitleSpecs)
            .use(HeaderContentSpecs)
            .use(ButtonSpecs),
}).buildDeps();

const roundTrip = (markup: string) => serializer.serialize(markupParser.parse(markup));
/** The description as the editor writes it: its blocks stand between empty lines. */
const content = (paragraphs: readonly string[], attrs = '') =>
    `:::header-content${attrs}\n\n${paragraphs.map((text) => `${text}\n\n`).join('')}:::`;
/** The description as the syntax examples write it. */
const exampleContent = (paragraphs: readonly string[], attrs = '') =>
    `:::header-content${attrs}\n${paragraphs.join('\n\n')}\n:::`;
const inHeader = (blocks: string) => `:::header{height="s" width="m"}\n\n${blocks}\n\n:::`;

const description = 'Portal description.';
const secondParagraph =
    'Second paragraph with a [link](/page), **bold**, *italic*, ~~strikethrough~~ and `monospace` text.';

describe('Header content extension', () => {
    it('should parse the description as a container of paragraphs with its size', () => {
        const doc = markupParser.parse(exampleContent([description, 'Second.'], '{size="1"}'));
        expect(doc.childCount).toBe(1);
        const node = doc.child(0);
        expect(node.type).toBe(headerContentNodeType(schema));
        expect(node.type.name).toBe(headerContentNodeName);
        expect(node.attrs).toEqual({size: 1});
        expect(node.childCount).toBe(2);
        expect(node.child(0).type.name).toBe('paragraph');
        expect(node.child(0).textContent).toBe(description);
        expect(node.child(1).textContent).toBe('Second.');
    });

    it('should use the same default in the schema and parser', () => {
        const defaults = {size: null};
        expect(headerContentNodeType(schema).createAndFill()?.attrs).toEqual(defaults);
        expect(markupParser.parse(exampleContent([description])).child(0).attrs).toEqual(defaults);
    });

    // description-001 … description-014 of the syntax examples.
    it.each(
        (['omitted', ...headerContentSizes] as const).flatMap((size) =>
            [1, 2].map((paragraphs) => ({size, paragraphs})),
        ),
    )(
        'should round trip the description with size $size and $paragraphs paragraphs',
        ({size, paragraphs}) => {
            const attrs = size === 'omitted' ? '' : `{size="${size}"}`;
            const texts = [description, secondParagraph].slice(0, paragraphs);
            const written = inHeader(content(texts, attrs));
            expect(roundTrip(`:::header\n\n${exampleContent(texts, attrs)}\n:::`)).toBe(written);
            expect(roundTrip(written)).toBe(written);
        },
    );

    it.each([
        [exampleContent([description], '{size="7"}'), content([description])],
        [exampleContent([description], '{size=""}'), content([description])],
        [exampleContent([description], '{unknown="value" .custom}'), content([description])],
        [exampleContent([description], '{size=3}'), content([description], '{size="3"}')],
        [
            exampleContent([description], "{size='4' color='red'}"),
            content([description], '{size="4"}'),
        ],
        [`:::header-content\n\n\n${description}\n\n\n:::`, content([description])],
    ])('should write %j in the normal form', (markup, serialized) => {
        expect(roundTrip(markup)).toBe(serialized);
        expect(roundTrip(serialized)).toBe(serialized);
    });

    // The marks and the links of the description are the ones of the editor.
    it.each([
        'Plain text. **Bold text.** *Italic text.* ++Underlined text.++ ~~Strikethrough text.~~ `inline code` [Team page](/page)',
        'Read the [public documentation](https://example.org/docs).',
        'Jump to the [contacts section](#contacts).',
        'Read the [**team documentation**](/docs).',
        '**Read the [team documentation](/docs) before publishing.**',
        '++Open the [team page](/page).++',
        '~~See the [old page](/old-page).~~',
        '**Important: *read this first* and visit the [team page](/page).**',
    ])('should round trip the marks and the links of %j', (text) => {
        const markup = content([text]);
        const doc = markupParser.parse(exampleContent([text]));
        expect(serializer.serialize(doc)).toBe(markup);
        expect(markupParser.parse(markup).toJSON()).toEqual(doc.toJSON());
    });

    it('should keep the marks of the text in the description', () => {
        const paragraph = markupParser
            .parse(exampleContent(['**b** *i* ++u++ ~~s~~ `m` [l](/page)']))
            .child(0)
            .child(0);
        const marks: string[] = [];
        paragraph.forEach((child) => marks.push(...child.marks.map((mark) => mark.type.name)));
        expect(marks).toEqual(['strong', 'em', 'ins', 'strike', 'code', 'link']);
    });

    it.each([
        ':::header-content\n:::',
        ':::header-content\n\n:::',
        ':::header-content{size="2"}\n:::',
    ])('should keep the empty description %j', (markup) => {
        const doc = markupParser.parse(markup);
        expect(doc.child(0).type.name).toBe(headerContentNodeName);
        expect(doc.child(0).textContent).toBe('');
        const serialized = serializer.serialize(doc);
        expect(serialized).toBe(
            `:::header-content${markup.includes('size') ? '{size="2"}' : ''}\n\n:::`,
        );
        expect(roundTrip(serialized)).toBe(serialized);
    });

    it.each([
        // nested-077 and nested-078 of the syntax examples, without the image.
        `:::header\n\n::header-title[Team portal]\n\n${exampleContent(['**Welcome to the team portal.**', 'Read the [documentation](/docs), check ++announcements++ and use `team-cli`.', '*Need help?* Open the [support page](/support).'])}\n:::`,
        `:::header\n\n::header-title[Team portal]\n\n${exampleContent(['**Team resources:** [documentation](/docs), [contacts](/contacts) and ++announcements++.', 'Use `team-cli` for routine tasks. *Read the documentation first.*'])}\n\n:button[Button 1]{href="/page" view="action" color="blue"}\n\n:button[Button 2]{href="/page" view="normal" color="gray"}\n:::`,
        // Dropping blocks by their place or number is a separate task: they are kept as written.
        `Before\n\n${exampleContent(['Outside a header.'])}\n\nAfter`,
        `:::header\n\n${exampleContent(['First.'])}\n\n${exampleContent(['Second.'], '{size="1"}')}\n:::`,
        exampleContent(['Text', '- item', exampleContent(['Inner'], '{size="6"}')]),
    ])('should round trip the description among other blocks in %j', (markup) => {
        const doc = markupParser.parse(markup);
        let contents = 0;
        doc.descendants((node) => {
            if (node.type.name === headerContentNodeName) contents++;
        });
        expect(contents).toBe(markup.match(/:::header-content/g)?.length);
        const serialized = serializer.serialize(doc);
        expect(markupParser.parse(serialized).toJSON()).toEqual(doc.toJSON());
        expect(roundTrip(serialized)).toBe(serialized);
    });

    it('should leave a description without a closing line as a paragraph', () => {
        expect(markupParser.parse(':::header-content\nText').child(0).type.name).toBe('paragraph');
    });

    it('should render the element of the view mode and read it back', () => {
        const doc = markupParser.parse(exampleContent(['Portal description.'], '{size="3"}'));
        const dom = DOMSerializer.fromSchema(schema).serializeNode(doc.child(0)) as HTMLElement;
        expect(dom.outerHTML).toBe(
            '<div class="g-md-header-content-plugin g-md-header-content-plugin_size_3" data-size="3"><p>Portal description.</p></div>',
        );
        const regular = DOMSerializer.fromSchema(schema).serializeNode(
            markupParser.parse(exampleContent([description])).child(0),
        ) as HTMLElement;
        expect(regular.outerHTML).toBe(
            `<div class="g-md-header-content-plugin"><p>${description}</p></div>`,
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
            `::header-title[Team portal]{size="1" color="yellow"}\n\n${content([description], '{size="3"}')}`,
        );
        const doc = deps.markupParser.parse(markup);
        expect(doc.child(0).child(1).type.name).toBe(headerContentNodeName);
        expect(deps.serializer.serialize(doc)).toBe(markup);
    });
});
