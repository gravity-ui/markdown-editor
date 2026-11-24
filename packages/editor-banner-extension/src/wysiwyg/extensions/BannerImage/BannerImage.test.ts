// @vitest-environment jsdom
import {ExtensionsManager} from '@gravity-ui/markdown-editor/core';
import {ReactRenderStorage, ReactRendererExtension} from '@gravity-ui/markdown-editor/extensions';
import {history, undo} from '@gravity-ui/markdown-editor/pm/history';
import {DOMParser, DOMSerializer, type Node} from '@gravity-ui/markdown-editor/pm/model';
import {
    EditorState,
    NodeSelection,
    type Selection,
    TextSelection,
} from '@gravity-ui/markdown-editor/pm/state';
import {EditorView} from '@gravity-ui/markdown-editor/pm/view';
import {BaseSchemaSpecs, ImageSpecs} from '@gravity-ui/markdown-editor/specs';
import {afterEach, describe, expect, it} from 'vitest';

import {Banner} from '../Banner';
import {type RemovedParts, toggleBannerPart} from '../Banner/commands';

import {bannerImageNodeName} from './BannerImageSpecs';
import {isBannerImagePopupOpen} from './plugins/BannerImagePopupPlugin';

const deps = new ExtensionsManager({
    extensions: (builder) =>
        builder
            .use(BaseSchemaSpecs, {})
            .use(ImageSpecs)
            .use(ReactRendererExtension, new ReactRenderStorage())
            .use(Banner, {}),
}).build();
const {schema, markupParser, serializer} = deps;

const banner = (...blocks: string[]) =>
    [':::banner{height="s" width="m"}', ...blocks, ':::'].join('\n\n');

// 0 banner 1 image 2 p 3 "Text" 7 /p 8 /banner 9
const withImage = ':::banner\n::banner-image{src="/a.png"}\nText\n:::';

let view: EditorView | undefined;
afterEach(() => {
    view?.destroy();
    view?.dom.remove();
    view = undefined;
});

function createView(markup: string, selection?: (doc: Node) => Selection) {
    const doc = markupParser.parse(markup);
    const dom = document.createElement('div');
    document.body.append(dom);
    view = new EditorView(dom, {
        state: EditorState.create({
            schema,
            doc,
            plugins: [...deps.plugins, history()],
            selection: selection?.(doc),
        }),
        nodeViews: deps.nodeViews,
    });
    return view;
}

const cursor = (pos: number) => (doc: Node) => TextSelection.create(doc, pos);
const nodeAt = (pos: number) => (doc: Node) => NodeSelection.create(doc, pos);

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

const selectedPos = (editor: EditorView) =>
    editor.state.selection instanceof NodeSelection ? editor.state.selection.from : null;

describe('Banner image extension', () => {
    describe('round trip', () => {
        it.each([
            banner('::banner-image{src="/a.png" alt="A \\"b\\"" title="T"}', 'Text'),
            banner('::banner-image', 'Text'),
        ])('should round trip %j', (source) => {
            const doc = markupParser.parse(source);
            expect(doc.firstChild?.firstChild?.type.name).toBe(bannerImageNodeName);
            expect(serializer.serialize(doc)).toBe(source);
            const container = document.createElement('div');
            container.append(DOMSerializer.fromSchema(schema).serializeFragment(doc.content));
            expect(DOMParser.fromSchema(schema).parse(container).toJSON()).toEqual(doc.toJSON());
        });

        it.each([
            ['A & b', 'A & b'],
            ['A &amp; b', 'A &amp;amp; b'],
        ])('should write the alternative text %j as %j', (alt, written) => {
            const image = schema.nodes[bannerImageNodeName].create({src: '/a.png?x=1&y=2', alt});
            const doc = schema.node('doc', null, [schema.nodes.banner.create(null, [image])]);
            const source = serializer.serialize(doc);
            expect(source).toBe(banner(`::banner-image{src="/a.png?x=1&y=2" alt="${written}"}`));
            expect(markupParser.parse(source).firstChild?.firstChild?.attrs.alt).toBe(alt);
        });

        it('should drop an unsafe address', () => {
            const src = ['javascript', 'alert(1)'].join(':');
            const doc = markupParser.parse(`:::banner\n::banner-image{src="${src}"}\n:::`);
            expect(doc.firstChild?.firstChild?.attrs.src).toBeNull();
            expect(serializer.serialize(doc)).toBe(banner('::banner-image'));
        });
    });

    describe('node view', () => {
        it('should show an image with an address as an image of the preview', () => {
            const editor = createView(
                ':::banner\n::banner-image{src="/a.png" alt="A" title="T"}\n:::',
            );
            const dom = editor.nodeDOM(1) as HTMLElement;
            expect(dom.tagName).toBe('IMG');
            expect(dom.getAttribute('src')).toBe('/a.png');
            expect(dom.getAttribute('alt')).toBe('A');
            expect(dom.getAttribute('title')).toBe('T');
            expect(dom.getAttribute('data-files-gallery-exclude')).toBe('true');
            expect(dom.classList.contains('g-md-banner-image-plugin')).toBe(true);
        });

        it('should name an image without the alternative text', () => {
            const editor = createView(withImage);
            const dom = editor.nodeDOM(1) as HTMLElement;
            expect(dom.getAttribute('role')).toBe('img');
            expect(dom.getAttribute('aria-label')).toBe('Image');
            expect(dom.hasAttribute('alt')).toBe(false);
        });

        it('should show a placeholder for an image without an address', () => {
            const editor = createView(':::banner\n::banner-image\n:::');
            const dom = editor.nodeDOM(1) as HTMLElement;
            expect(dom.tagName).toBe('DIV');
            expect(dom.getAttribute('role')).toBe('button');
            expect(dom.getAttribute('aria-label')).toBe('Add image');
            expect(dom.getAttribute('contenteditable')).toBe('false');
        });

        it('should update the attributes in place and replace the element for a new address kind', () => {
            const editor = createView(withImage);
            const dom = editor.nodeDOM(1) as HTMLElement;
            editor.dispatch(editor.state.tr.setNodeAttribute(1, 'src', '/b.png'));
            expect(editor.nodeDOM(1)).toBe(dom);
            expect(dom.getAttribute('src')).toBe('/b.png');
            editor.dispatch(editor.state.tr.setNodeAttribute(1, 'alt', 'B'));
            expect(dom.getAttribute('alt')).toBe('B');
            expect(dom.hasAttribute('role')).toBe(false);
            editor.dispatch(editor.state.tr.setNodeAttribute(1, 'src', null));
            expect((editor.nodeDOM(1) as HTMLElement).tagName).toBe('DIV');
        });
    });

    describe('selection and removal', () => {
        it('should select the image with Backspace at the start of the next paragraph', () => {
            const editor = createView(withImage, cursor(3));
            expect(press(editor, 'Backspace')).toBe(true);
            expect(selectedPos(editor)).toBe(1);
            expect(markup(editor)).toBe(banner('::banner-image{src="/a.png"}', 'Text'));
        });

        it('should select the image with Backspace at the start of the description', () => {
            // 0 banner 1 image 2 content 3 p 4 "Text"
            const editor = createView(
                ':::banner\n::banner-image{src="/a.png"}\n:::banner-content\nText\n:::\n:::',
                cursor(4),
            );
            expect(press(editor, 'Backspace')).toBe(true);
            expect(selectedPos(editor)).toBe(1);
        });

        it('should select the image with Delete at the end of the previous paragraph', () => {
            const doc = schema.node('doc', null, [
                schema.nodes.banner.create(null, [
                    schema.nodes.paragraph.create(null, schema.text('Text')),
                    schema.nodes[bannerImageNodeName].create({src: '/a.png'}),
                ]),
            ]);
            const editor = createView('');
            editor.updateState(
                EditorState.create({
                    schema,
                    doc,
                    plugins: deps.plugins,
                    selection: TextSelection.create(doc, 6),
                }),
            );
            expect(press(editor, 'Delete')).toBe(true);
            expect(selectedPos(editor)).toBe(7);
        });

        it.each(['Backspace', 'Delete'])(
            'should remove the selected image with %s in one undo step',
            (key) => {
                const editor = createView(withImage, nodeAt(1));
                expect(press(editor, key)).toBe(true);
                expect(children(editor.state.doc.firstChild)).toEqual(['paragraph']);
                expect(editor.state.selection.$from.parent.textContent).toBe('Text');
                expect(undo(editor.state, editor.dispatch)).toBe(true);
                expect(markup(editor)).toBe(banner('::banner-image{src="/a.png"}', 'Text'));
            },
        );

        it('should replace the only image with an empty paragraph', () => {
            const editor = createView(':::banner\n::banner-image{src="/a.png"}\n:::', nodeAt(1));
            expect(press(editor, 'Backspace')).toBe(true);
            expect(children(editor.state.doc.firstChild)).toEqual(['paragraph']);
        });

        it('should reject a second image in a banner', () => {
            const editor = createView(withImage);
            const doc = editor.state.doc;
            editor.dispatch(editor.state.tr.insert(8, schema.nodes[bannerImageNodeName].create()));
            expect(editor.state.doc).toBe(doc);
        });

        it('should select the image and open its window on a press', () => {
            const editor = createView(withImage, cursor(5));
            const event = new MouseEvent('mousedown', {button: 0, bubbles: true, cancelable: true});
            (editor.nodeDOM(1) as HTMLElement).dispatchEvent(event);
            expect(event.defaultPrevented).toBe(true);
            expect(selectedPos(editor)).toBe(1);
            expect(isBannerImagePopupOpen(editor.state)).toBe(true);
        });

        it('should open and close the window from the keyboard', () => {
            const editor = createView(withImage, nodeAt(1));
            expect(press(editor, 'Enter')).toBe(true);
            expect(isBannerImagePopupOpen(editor.state)).toBe(true);
            expect(press(editor, 'Escape')).toBe(true);
            expect(isBannerImagePopupOpen(editor.state)).toBe(false);
            expect(selectedPos(editor)).toBe(1);
        });

        it('should close the window when the image is no longer selected', () => {
            const editor = createView(withImage, nodeAt(1));
            press(editor, 'Enter');
            editor.dispatch(
                editor.state.tr.setSelection(TextSelection.create(editor.state.doc, 4)),
            );
            expect(isBannerImagePopupOpen(editor.state)).toBe(false);
        });
    });

    describe('Image switch', () => {
        const toggle = (editor: EditorView, enabled: boolean, removed: RemovedParts) =>
            toggleBannerPart(0, 'image', enabled, removed)(editor.state, editor.dispatch);

        it('should insert a placeholder before the other blocks', () => {
            const editor = createView(':::banner\n::banner-title[T]\nText\n:::');
            expect(toggle(editor, true, new Map())).toBe(true);
            expect(children(editor.state.doc.firstChild)).toEqual([
                bannerImageNodeName,
                'banner_title',
                'paragraph',
            ]);
            expect(editor.state.doc.firstChild?.firstChild?.attrs.src).toBeNull();
        });

        it('should restore the removed image with its address', () => {
            const editor = createView(withImage);
            const removed: RemovedParts = new Map();
            expect(toggle(editor, false, removed)).toBe(true);
            expect(markup(editor)).toBe(banner('Text'));
            expect(toggle(editor, true, removed)).toBe(true);
            expect(markup(editor)).toBe(banner('::banner-image{src="/a.png"}', 'Text'));
        });
    });
});
