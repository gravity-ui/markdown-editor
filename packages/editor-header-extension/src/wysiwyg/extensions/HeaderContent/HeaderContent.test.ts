// @vitest-environment jsdom
import {ExtensionsManager} from '@gravity-ui/markdown-editor/core';
import {Placeholder} from '@gravity-ui/markdown-editor/extensions';
import {deleteSelection, lift, toggleMark} from '@gravity-ui/markdown-editor/pm/commands';
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
import {describe, expect, it} from 'vitest';

import {headerContentMarkup} from '../../../../tests/content';
import {createTestEditor, header, headerExtensions, setCursor} from '../../../../tests/editor';
import {HeaderSpecs} from '../Header/HeaderSpecs';
import {runCommand as run} from '../commands';

import {headerContentNodeName, headerContentNodeType} from './HeaderContentSpecs';

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
            .use(HeaderSpecs),
}).buildDeps();

const editing = createTestEditor(
    headerExtensions((builder) =>
        builder
            .use(BoldSpecs)
            .use(ItalicSpecs)
            .use(UnderlineSpecs)
            .use(StrikeSpecs)
            .use(CodeSpecs)
            .use(LinkSpecs)
            .use(Placeholder, {}),
    ),
);
const custom = createTestEditor(
    headerExtensions((builder) => builder.use(Placeholder, {[headerContentNodeName]: 'Text'})),
);
const placeholders = (editor: {dom: HTMLElement}) =>
    Array.from(
        editor.dom.querySelectorAll('.g-md-header-content-plugin .g-md-placeholder'),
        (element) => element.textContent,
    );

const roundTrip = (markup: string) => serializer.serialize(markupParser.parse(markup));
const inHeader = (markup: string) => `:::header\n\n${markup}\n:::`;
const exampleContent = (paragraphs: readonly string[], attrs = '') =>
    `:::header-content${attrs}\n${paragraphs.join('\n\n')}\n:::`;

const description = 'Portal description.';
const PLACEHOLDER = 'Short text: for example, what this page is about and who it is for';
const TEXT_START = 3;
const TEXT_END = 22;
const next = 'Text';

describe('Header content extension', () => {
    it('should parse the description as a container of paragraphs without attributes', () => {
        const doc = markupParser.parse(
            inHeader(exampleContent([description, 'Second.'], '{size="1"}')),
        );
        expect(doc.child(0).childCount).toBe(1);
        const node = doc.child(0).child(0);
        expect(node.type).toBe(headerContentNodeType(schema));
        expect(node.type.name).toBe(headerContentNodeName);
        expect(node.attrs).toEqual({});
        expect(node.childCount).toBe(2);
        expect(node.child(0).type.name).toBe('paragraph');
        expect(node.child(0).textContent).toBe(description);
        expect(node.child(1).textContent).toBe('Second.');
    });

    it.each([
        [exampleContent([description], '{size="7"}'), headerContentMarkup([description])],
        [exampleContent([description], '{size=""}'), headerContentMarkup([description])],
        [
            exampleContent([description], '{unknown="value" .custom}'),
            headerContentMarkup([description]),
        ],
        [exampleContent([description], '{size=3}'), headerContentMarkup([description])],
        [
            exampleContent([description], "{size='4' color='red'}"),
            headerContentMarkup([description]),
        ],
        [`:::header-content\n\n\n${description}\n\n\n:::`, headerContentMarkup([description])],
    ])('should write %j in the normal form', (markup, serialized) => {
        expect(roundTrip(inHeader(markup))).toBe(header(serialized));
        expect(roundTrip(header(serialized))).toBe(header(serialized));
    });

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
        const markup = header(headerContentMarkup([text]));
        const doc = markupParser.parse(inHeader(exampleContent([text])));
        expect(serializer.serialize(doc)).toBe(markup);
        expect(markupParser.parse(markup).toJSON()).toEqual(doc.toJSON());
    });

    it('should keep the marks of the text in the description', () => {
        const paragraph = markupParser
            .parse(inHeader(exampleContent(['**b** *i* ++u++ ~~s~~ `m` [l](/page)'])))
            .child(0)
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
        const doc = markupParser.parse(inHeader(markup));
        expect(doc.child(0).child(0).type.name).toBe(headerContentNodeName);
        expect(doc.child(0).textContent).toBe('');
        const serialized = serializer.serialize(doc);
        expect(serialized).toBe(header(':::header-content\n\n:::'));
        expect(roundTrip(serialized)).toBe(serialized);
    });

    it.each([
        `:::header\n\n${exampleContent(['**Welcome to the team portal.**', 'Read the [documentation](/docs), check ++announcements++ and use `team-cli`.', '*Need help?* Open the [support page](/support).'])}\n:::`,
        `:::header\n\n${exampleContent(['**Team resources:** [documentation](/docs), [contacts](/contacts) and ++announcements++.', 'Use `team-cli` for routine tasks. *Read the documentation first.*'])}\n\nText after the description.\n:::`,
        header('Text before the description.', headerContentMarkup([description])),
    ])('should round trip the description among other blocks in %j', (markup) => {
        const doc = markupParser.parse(markup);
        let contents = 0;
        doc.descendants((node) => {
            if (node.type.name === headerContentNodeName) contents++;
        });
        expect(contents).toBe(1);
        const serialized = serializer.serialize(doc);
        expect(markupParser.parse(serialized).toJSON()).toEqual(doc.toJSON());
        expect(roundTrip(serialized)).toBe(serialized);
    });

    it.each([
        ['outside a header', `Before\n\n${exampleContent(['Outside.'])}`, 'Before\n\nOutside.'],
        [
            'after the first one in a header',
            inHeader(`${exampleContent(['First.'])}\n\n${exampleContent(['Second.'])}`),
            header(headerContentMarkup(['First.']), 'Second.'),
        ],
        [
            'inside a description',
            inHeader(exampleContent(['Text', exampleContent(['Inner'])])),
            header(headerContentMarkup(['Text', 'Inner'])),
        ],
        [
            'after an empty one in a header',
            inHeader(`:::header-content\n:::\n\n${exampleContent(['Second.'])}`),
            header(headerContentMarkup([]), 'Second.'),
        ],
        [
            'in a list outside a header',
            `- ${exampleContent(['Item.']).replace(/\n/g, '\n  ')}`,
            '- Item.',
        ],
    ])('should keep only the blocks of a description %s', (_name, markup, serialized) => {
        expect(roundTrip(markup)).toBe(serialized);
    });

    it('should leave a description without a closing line as a paragraph', () => {
        expect(markupParser.parse(':::header-content\nText').child(0).type.name).toBe('paragraph');
    });

    it('should render the element of the view mode and read it back', () => {
        const doc = markupParser.parse(inHeader(exampleContent([description])));
        const node = doc.child(0).child(0);
        const dom = DOMSerializer.fromSchema(schema).serializeNode(node) as HTMLElement;
        expect(dom.outerHTML).toBe(
            `<div class="g-md-header-content-plugin"><p>${description}</p></div>`,
        );
        const container = document.createElement('div');
        container.append(DOMSerializer.fromSchema(schema).serializeFragment(doc.content));
        container.querySelector('.g-md-header-content-plugin')?.setAttribute('data-size', '3');
        const parsed = DOMParser.fromSchema(schema).parse(container);
        expect(parsed.toJSON()).toEqual(doc.toJSON());
    });

    it('should be part of the header extension', () => {
        const markup = header(headerContentMarkup([description]), next);
        const doc = editing.markupParser.parse(markup);
        expect(doc.child(0).child(0).type.name).toBe(headerContentNodeName);
        expect(editing.serializer.serialize(doc)).toBe(markup);
    });

    it.each([
        ['an empty description', ':::header-content\n\n:::', [PLACEHOLDER]],
        ['a description with text', headerContentMarkup([description]), []],
    ])('should show the placeholder only in %s', (_name, markup, expected) => {
        const editor = editing.createView(header(markup));
        expect(placeholders(editor)).toEqual(expected);
        expect(editing.markup(editor)).toBe(header(markup));
    });

    it('should hide the placeholder when text is typed and show it again when it is deleted', () => {
        const editor = editing.createView(header(':::header-content\n\n:::'));
        editor.dispatch(editor.state.tr.insertText('Text', 3));
        expect(placeholders(editor)).toEqual([]);
        editor.dispatch(editor.state.tr.delete(3, 7));
        expect(placeholders(editor)).toEqual([PLACEHOLDER]);
    });

    it('should show the placeholder of the editor option', () => {
        const editor = custom.createView(header(':::header-content\n\n:::'));
        expect(placeholders(editor)).toEqual(['Text']);
    });
});

describe('Header content editing', () => {
    const {createView, markup} = editing;
    const twoParagraphs = headerContentMarkup(['First.', 'Second.']);

    it('should type text into the description', () => {
        const editor = createView(header(headerContentMarkup([description])));
        setCursor(editor, TEXT_END);
        editor.dispatch(editor.state.tr.insertText(' More text.'));
        expect(markup(editor)).toBe(
            header(headerContentMarkup(['Portal description. More text.'])),
        );
    });

    it.each([
        ['strong', undefined, '**Portal** description.'],
        ['em', undefined, '*Portal* description.'],
        ['ins', undefined, '++Portal++ description.'],
        ['strike', undefined, '~~Portal~~ description.'],
        ['code', undefined, '`Portal` description.'],
        ['link', {href: '/page'}, '[Portal](/page) description.'],
    ])('should add and remove the %s mark of the selected text', (mark, attrs, written) => {
        const editor = createView(header(headerContentMarkup([description])));
        setCursor(editor, TEXT_START, TEXT_START + 6);
        expect(run(editor, toggleMark(editing.schema.marks[mark], attrs))).toBe(true);
        expect(markup(editor)).toBe(header(headerContentMarkup([written])));
        expect(run(editor, toggleMark(editing.schema.marks[mark], attrs))).toBe(true);
        expect(markup(editor)).toBe(header(headerContentMarkup([description])));
    });

    it('should not lift a paragraph out of the description', () => {
        const editor = createView(header(twoParagraphs, next));
        setCursor(editor, 12);
        expect(run(editor, lift)).toBe(false);
        expect(markup(editor)).toBe(header(twoParagraphs, next));
    });

    it('should keep the description when its selected paragraphs are replaced with text', () => {
        const editor = createView(header(twoParagraphs, next));
        setCursor(editor, 3, 18);
        editor.dispatch(editor.state.tr.insertText('New text.'));
        expect(markup(editor)).toBe(header(headerContentMarkup(['New text.']), next));
    });

    it('should keep the description when the text selected up to the next block is deleted', () => {
        const editor = createView(header(headerContentMarkup([description]), next));
        const {doc} = editor.state;
        const selection = editor.someProp('createSelectionBetween', (between) =>
            between(editor, doc.resolve(3), doc.resolve(25)),
        );
        if (selection) editor.dispatch(editor.state.tr.setSelection(selection));
        expect(run(editor, deleteSelection)).toBe(true);
        expect(markup(editor)).toBe(header(headerContentMarkup([]), next));
    });
});
