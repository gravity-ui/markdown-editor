// @vitest-environment jsdom
import {ExtensionsManager} from '@gravity-ui/markdown-editor/core';
import {ReactRenderStorage, ReactRendererExtension} from '@gravity-ui/markdown-editor/extensions';
import {DOMParser, DOMSerializer, type Node} from '@gravity-ui/markdown-editor/pm/model';
import {EditorState, TextSelection} from '@gravity-ui/markdown-editor/pm/state';
import {EditorView} from '@gravity-ui/markdown-editor/pm/view';
import {
    BaseSchemaSpecs,
    BoldSpecs,
    ItalicSpecs,
    LinkSpecs,
    ListsSpecs,
} from '@gravity-ui/markdown-editor/specs';
import {afterEach, describe, expect, it} from 'vitest';

import {Banner} from '../Banner';
import {type RemovedParts, toggleBannerPart} from '../Banner/commands';

import {bannerContentNodeName} from './BannerContentSpecs';

const deps = new ExtensionsManager({
    extensions: (builder) =>
        builder
            .use(BaseSchemaSpecs, {})
            .use(BoldSpecs)
            .use(ItalicSpecs)
            .use(LinkSpecs)
            .use(ListsSpecs)
            .use(ReactRendererExtension, new ReactRenderStorage())
            .use(Banner, {}),
}).build();
const {schema, markupParser, serializer} = deps;

const banner = (...blocks: string[]) =>
    [':::banner{height="s" width="m"}', ...blocks, ':::'].join('\n\n');
const description = (...blocks: string[]) => [':::banner-content', ...blocks, ':::'].join('\n\n');

// 0 banner 1 title 2 "T" 3 /title 4 content 5 p 6 "One" 9 /p 10 p 11 "Two" 14 /p 15 /content 16 /banner 17
const described = ':::banner\n::banner-title[T]\n:::banner-content\nOne\n\nTwo\n:::\n:::';

let view: EditorView | undefined;
afterEach(() => {
    view?.destroy();
    view = undefined;
});

function createView(source: Node | string, from?: number, to = from) {
    const doc = typeof source === 'string' ? markupParser.parse(source) : source;
    view = new EditorView(document.createElement('div'), {
        state: EditorState.create({
            schema,
            doc,
            plugins: deps.plugins,
            selection: from === undefined ? undefined : TextSelection.create(doc, from, to),
        }),
        nodeViews: deps.nodeViews,
    });
    return view;
}

function press(editor: EditorView, key: string) {
    const event = new KeyboardEvent('keydown', {key, cancelable: true});
    return editor.someProp('handleKeyDown', (handler) => handler(editor, event)) ?? false;
}

const markup = (editor: EditorView) => serializer.serialize(editor.state.doc);

function children(node: Node | null | undefined) {
    const types: string[] = [];
    node?.forEach((child) => types.push(child.type.name));
    return types;
}

const paragraph = (text = '') =>
    schema.nodes.paragraph.create(null, text ? schema.text(text) : null);
const content = (...blocks: Node[]) => schema.nodes[bannerContentNodeName].create(null, blocks);

describe('Banner description extension', () => {
    describe('specs', () => {
        it.each([
            banner(description('Text **bold** *italic* [link](https://a.b)', 'Second')),
            banner('::banner-title[T]', description('One', 'Two')),
        ])('should round trip %j', (source) => {
            const doc = markupParser.parse(source);
            expect(children(doc.firstChild)).toContain(bannerContentNodeName);
            expect(serializer.serialize(doc)).toBe(source);
            const container = document.createElement('div');
            container.append(DOMSerializer.fromSchema(schema).serializeFragment(doc.content));
            expect(DOMParser.fromSchema(schema).parse(container).toJSON()).toEqual(doc.toJSON());
        });

        it('should read a description outside a banner as its blocks', () => {
            const doc = markupParser.parse(':::banner-content\nOut\n:::');
            expect(children(doc)).toEqual(['paragraph']);
            expect(doc.textContent).toBe('Out');
        });

        it('should read the second description of a banner as blocks of the banner', () => {
            const doc = markupParser.parse(
                ':::banner\n:::banner-content\nOne\n:::\n:::banner-content\nTwo\n:::\n:::',
            );
            expect(children(doc.firstChild)).toEqual([bannerContentNodeName, 'paragraph']);
        });
    });

    describe('boundary keys', () => {
        it('should not join the description with the title with Backspace at its start', () => {
            const editor = createView(described, 6);
            expect(press(editor, 'Backspace')).toBe(true);
            expect(markup(editor)).toBe(banner('::banner-title[T]', description('One', 'Two')));
        });

        it('should not join the title with the description with Delete at its end', () => {
            const editor = createView(described, 3);
            expect(press(editor, 'Delete')).toBe(true);
            expect(markup(editor)).toBe(banner('::banner-title[T]', description('One', 'Two')));
        });

        it('should not move text out of the description with Delete at its end', () => {
            const editor = createView(
                ':::banner\n:::banner-content\nOne\n:::\n:::\n\nAfter',
                // 0 banner 1 content 2 p 3 "One" 6
                6,
            );
            expect(press(editor, 'Delete')).toBe(true);
            expect(markup(editor)).toBe(`${banner(description('One'))}\n\nAfter`);
        });

        it('should join the paragraphs inside the description with Backspace', () => {
            const editor = createView(described, 11);
            expect(press(editor, 'Backspace')).toBe(false);
        });

        it('should keep the text in the description with Enter in an empty paragraph', () => {
            const doc = schema.node('doc', null, [
                schema.nodes.banner.create(null, [content(paragraph('One'), paragraph())]),
            ]);
            // 0 banner 1 content 2 p 3 "One" 6 /p 7 p 8
            const editor = createView(doc, 8);
            expect(press(editor, 'Enter')).toBe(true);
            expect(editor.state.doc.eq(doc)).toBe(true);
        });

        it('should leave an empty paragraph after deleting all the text of the description', () => {
            const editor = createView(described, 6, 14);
            expect(press(editor, 'Backspace')).toBe(true);
            expect(children(editor.state.doc.firstChild)).toEqual([
                'banner_title',
                bannerContentNodeName,
            ]);
            expect(children(editor.state.doc.firstChild?.child(1))).toEqual(['paragraph']);
            expect(editor.state.doc.firstChild?.child(1).textContent).toBe('');
        });

        it('should keep a banner with only a description with Delete in an empty paragraph before it', () => {
            const doc = schema.node('doc', null, [
                paragraph(),
                schema.nodes.banner.create(null, [content(paragraph('One'))]),
            ]);
            const editor = createView(doc, 1);
            press(editor, 'Delete');
            expect(markup(editor)).toBe(banner(description('One')));
        });
    });

    describe('unwrap', () => {
        it('should unwrap a second description inserted into a banner', () => {
            const editor = createView(described);
            editor.dispatch(editor.state.tr.insert(16, content(paragraph('Extra'))));
            expect(children(editor.state.doc.firstChild)).toEqual([
                'banner_title',
                bannerContentNodeName,
                'paragraph',
            ]);
            expect(editor.state.doc.firstChild?.lastChild?.textContent).toBe('Extra');
        });

        it('should unwrap a description inserted outside a banner', () => {
            const editor = createView(described);
            editor.dispatch(editor.state.tr.insert(17, content(paragraph('A'), paragraph('B'))));
            expect(children(editor.state.doc)).toEqual(['banner', 'paragraph', 'paragraph']);
        });
    });

    describe('Description switch', () => {
        const toggle = (editor: EditorView, enabled: boolean, removed: RemovedParts) =>
            toggleBannerPart(0, 'content', enabled, removed)(editor.state, editor.dispatch);

        it('should switch the description off and on with several paragraphs, marks and links', () => {
            const source = banner(
                '::banner-title[T]',
                description('**Bold** and *italic*', '[link](https://a.b)', 'Third'),
            );
            const editor = createView(source);
            const removed: RemovedParts = new Map();
            expect(toggle(editor, false, removed)).toBe(true);
            expect(markup(editor)).toBe(banner('::banner-title[T]'));
            expect(toggle(editor, true, removed)).toBe(true);
            expect(markup(editor)).toBe(source);
        });

        it('should make a description from the only paragraph with marks and links', () => {
            const editor = createView(':::banner\n**Bold** [link](https://a.b)\n:::');
            expect(toggle(editor, true, new Map())).toBe(true);
            expect(markup(editor)).toBe(banner(description('**Bold** [link](https://a.b)')));
        });

        it('should insert a sample description into an empty banner', () => {
            const editor = createView(':::banner\n:::');
            expect(toggle(editor, true, new Map())).toBe(true);
            expect(children(editor.state.doc.firstChild)).toEqual([bannerContentNodeName]);
            expect(editor.state.doc.firstChild?.textContent).not.toBe('');
        });
    });
});
