// @vitest-environment jsdom
import {ExtensionsManager} from '@gravity-ui/markdown-editor/core';
import {undo} from '@gravity-ui/markdown-editor/pm/history';
import {DOMParser, DOMSerializer, Fragment, Slice} from '@gravity-ui/markdown-editor/pm/model';
import {NodeSelection, TextSelection} from '@gravity-ui/markdown-editor/pm/state';
import type {EditorView} from '@gravity-ui/markdown-editor/pm/view';
import {
    BaseSchemaSpecs,
    ImageSpecs,
    ImgSizeSpecs,
    LinkSpecs,
} from '@gravity-ui/markdown-editor/specs';
import {describe, expect, it} from 'vitest';

import {createTestEditor, header, setCursor} from '../../../../tests/editor';
import {HeaderSpecs} from '../Header/HeaderSpecs';
import {type RemovedParts, toggleHeaderPart} from '../Header/commands';
import {runCommand} from '../commands';

import {headerImageNodeName, headerImageNodeType} from './HeaderImageSpecs';
import {removeHeaderImage, selectedHeaderImage, setHeaderImageAttrs} from './commands';

const {schema, markupParser, serializer} = new ExtensionsManager({
    extensions: (builder) => builder.use(BaseSchemaSpecs, {}).use(HeaderSpecs),
}).buildDeps();

const roundTrip = (markup: string) => serializer.serialize(markupParser.parse(markup));

const {createView, markup} = createTestEditor();

const scriptUrl = ['javascript', 'alert(1)'].join(':');
const image = '::header-image{src="/a.png" alt="A"}';
const emptyImage = '::header-image';
const IMAGE_POS = 1;

const imageDom = (editor: EditorView, pos = IMAGE_POS) => editor.nodeDOM(pos) as HTMLElement;

const selectNode = (editor: EditorView, pos: number) =>
    editor.dispatch(editor.state.tr.setSelection(NodeSelection.create(editor.state.doc, pos)));

const press = (editor: EditorView, key: string) =>
    editor.someProp('handleKeyDown', (handle) =>
        handle(editor, new KeyboardEvent('keydown', {key})),
    ) ?? false;

const countImages = (editor: EditorView) => {
    let count = 0;
    editor.state.doc.descendants((node) => {
        if (node.type.name === headerImageNodeName) count++;
    });
    return count;
};

/** The position of the start of the text `text`, or of its end. */
const textPos = (editor: EditorView, text: string, end = false) => {
    let found = -1;
    editor.state.doc.descendants((node, pos) => {
        if (found < 0 && node.isText && node.text === text) {
            found = end ? pos + text.length : pos;
        }
    });
    return found;
};

describe('Header image specs', () => {
    it('should parse the image as an atom block with its attributes', () => {
        const doc = markupParser.parse(
            header(
                '::header-image{src="https://example.org/a.jpg" alt="Team" title="Project team"}',
            ),
        );
        const node = doc.child(0).child(0);
        expect(node.type).toBe(headerImageNodeType(schema));
        expect(node.attrs).toEqual({
            src: 'https://example.org/a.jpg',
            alt: 'Team',
            title: 'Project team',
        });
        expect(node.isAtom).toBe(true);
        expect(node.isBlock).toBe(true);
    });

    it('should use the same defaults in the schema and the parser', () => {
        const defaults = {src: null, alt: '', title: null};
        expect(headerImageNodeType(schema).create().attrs).toEqual(defaults);
        expect(markupParser.parse(header(emptyImage)).child(0).child(0).attrs).toEqual(defaults);
    });

    it.each(
        ['https://example.org/a.jpg', 'blob:https://example.org/0a1b', './.files/a.png'].flatMap(
            (src) =>
                [false, true].flatMap((alt) => [false, true].map((title) => ({src, alt, title}))),
        ),
    )('should round trip the address $src with alt $alt and title $title', ({src, alt, title}) => {
        const source = header(
            `::header-image{src="${src}"${alt ? ' alt="Team"' : ''}${title ? ' title="Project team"' : ''}}`,
            'Text',
        );
        expect(roundTrip(source)).toBe(source);
    });

    it.each([
        ['::header-image{src="/a.png" alt=""}', '::header-image{src="/a.png"}'],
        ['::header-image{src="/a.png" title=""}', '::header-image{src="/a.png"}'],
        [
            '::header-image{title="T" alt="A" src="/a.png"}',
            '::header-image{src="/a.png" alt="A" title="T"}',
        ],
        ["::header-image{src='/a.png' alt=Team}", '::header-image{src="/a.png" alt="Team"}'],
        ['::header-image{src="  /a.png  " unknown="x" .custom}', '::header-image{src="/a.png"}'],
        [`::header-image{src="${scriptUrl}" alt="A"}`, '::header-image{alt="A"}'],
        ['::header-image{src="data:image/png;base64,AAAA"}', emptyImage],
        [
            '::header-image{src="/a?x=1&amp;y=2" alt="Q&amp;A"}',
            '::header-image{src="/a?x=1&y=2" alt="Q&A"}',
        ],
        ['::header-image{}', emptyImage],
    ])('should write %j in the normal form', (source, normal) => {
        expect(roundTrip(header(source))).toBe(header(normal));
        expect(roundTrip(header(normal))).toBe(header(normal));
    });

    it.each([
        '::header-image{src="/a?x=1&y=2" alt="Q&A &amp;copy;"}',
        '::header-image{src="/a\\"b\\\\c.png" alt="A \\"quote\\" and a \\\\ backslash"}',
        '::header-image{src="./.files/photo 1 (final).jpg" title="<b>bold</b> **bold** {braces} [brackets]"}',
        '::header-image{src="/a.png" alt="Команда проекта 🚀"}',
    ])('should keep the values of %j as written', (block) => {
        const doc = markupParser.parse(header(block));
        expect(doc.child(0).child(0).type.name).toBe(headerImageNodeName);
        expect(roundTrip(header(block))).toBe(header(block));
    });

    it.each(['alt', 'title'])('should write a line break in the %s on one line', (name) => {
        const doc = schema.node('doc', null, [
            schema.node('header', null, [
                headerImageNodeType(schema).create({src: '/a.png', [name]: 'Project\r\n team'}),
            ]),
        ]);
        expect(serializer.serialize(doc)).toBe(
            header(`::header-image{src="/a.png" ${name}="Project team"}`),
        );
    });

    it.each([
        header('Text', image, 'More'),
        header(image),
        header(header(image), image),
        `${header(image)}\n\n${header(emptyImage, 'Text')}`,
    ])('should keep the image among the other blocks in %j', (source) => {
        expect(roundTrip(source)).toBe(source);
    });

    it('should leave a second image of a banner as a paragraph', () => {
        const source = header(image, '::header-image{src="/b.png"}');
        const banner = markupParser.parse(source).child(0);
        expect(banner.child(0).type.name).toBe(headerImageNodeName);
        expect(banner.child(1).type.name).toBe('paragraph');
    });

    it('should render the element of the preview and read it back', () => {
        const node = markupParser
            .parse(header('::header-image{src="/a.png" alt="A" title="T"}'))
            .child(0)
            .child(0);
        const dom = DOMSerializer.fromSchema(schema).serializeNode(node) as HTMLElement;
        expect(dom.outerHTML).toBe(
            '<img class="g-md-header-image-plugin" data-files-gallery-exclude="true" src="/a.png" alt="A" title="T">',
        );
        const container = document.createElement('div');
        container.append(dom);
        expect(DOMParser.fromSchema(schema).parse(container).child(0).toJSON()).toEqual(
            node.toJSON(),
        );
    });

    it('should read the image of the preview before the image of the editor', () => {
        const deps = new ExtensionsManager({
            extensions: (builder) =>
                builder
                    .use(BaseSchemaSpecs, {})
                    .use(LinkSpecs)
                    .use(ImageSpecs)
                    .use(ImgSizeSpecs, {})
                    .use(HeaderSpecs),
        }).buildDeps();
        const container = document.createElement('div');
        container.innerHTML =
            '<img class="g-md-header-image-plugin" data-files-gallery-exclude="true" src="/a.png" alt="A">';
        const doc = DOMParser.fromSchema(deps.schema).parse(container);
        expect(doc.child(0).type.name).toBe(headerImageNodeName);
    });
});

describe('Header image node view', () => {
    it.each([
        [
            'an image with every attribute',
            '::header-image{src="/a.png" alt="A" title="T"}',
            '<img class="g-md-header-image-plugin g-md-header-image-nodeview" data-files-gallery-exclude="true" src="/a.png" alt="A" title="T">',
        ],
        [
            'an image without the alternative text',
            '::header-image{src="/a.png"}',
            '<img class="g-md-header-image-plugin g-md-header-image-nodeview" data-files-gallery-exclude="true" src="/a.png" role="img" aria-label="Image">',
        ],
        [
            'a placeholder without an address',
            '::header-image{alt="A" title="T"}',
            '<div class="g-md-header-image-plugin g-md-header-image-nodeview g-md-header-image-nodeview_empty" contenteditable="false" data-files-gallery-exclude="true" role="button" aria-label="Add image"></div>',
        ],
    ])('should render %s', (_name, block, html) => {
        const editor = createView(header(block, 'Text'));
        expect(imageDom(editor).outerHTML).toBe(html);
        expect(imageDom(editor).parentElement?.classList).toContain('g-md-header-plugin');
    });

    it.each([
        ['the alternative text', {alt: 'B'}, {src: '/a.png', alt: 'B', title: null}],
        ['the tooltip', {title: 'T'}, {src: '/a.png', alt: 'A', title: 'T'}],
        ['the address', {src: '/b.png'}, {src: '/b.png', alt: 'A', title: null}],
    ])('should keep the element when %s changes', (_name, attrs, expected) => {
        const editor = createView(header(image, 'Text'));
        const dom = imageDom(editor);
        expect(runCommand(editor, setHeaderImageAttrs(IMAGE_POS, attrs))).toBe(true);
        expect(imageDom(editor)).toBe(dom);
        expect({
            src: dom.getAttribute('src'),
            alt: dom.getAttribute('alt'),
            title: dom.getAttribute('title'),
        }).toEqual(expected);
    });

    it.each([
        ['an address is set', emptyImage, {src: '/b.png'}, 'IMG'],
        ['the address is removed', image, {src: null}, 'DIV'],
    ])('should replace the element and keep the selection when %s', (_name, block, attrs, tag) => {
        const editor = createView(header(block, 'Text'));
        const dom = imageDom(editor);
        selectNode(editor, IMAGE_POS);
        expect(runCommand(editor, setHeaderImageAttrs(IMAGE_POS, attrs))).toBe(true);
        expect(imageDom(editor)).not.toBe(dom);
        expect(imageDom(editor).tagName).toBe(tag);
        expect(selectedHeaderImage(editor.state)?.pos).toBe(IMAGE_POS);
    });
});

describe('Header image commands', () => {
    it.each([
        [{src: '/b.png'}, '::header-image{src="/b.png" alt="A"}'],
        [
            {src: '  https://example.org/b.png  '},
            '::header-image{src="https://example.org/b.png" alt="A"}',
        ],
        [{alt: ''}, '::header-image{src="/a.png"}'],
        [{title: 'T'}, '::header-image{src="/a.png" alt="A" title="T"}'],
        [{src: null}, '::header-image{alt="A"}'],
        [{alt: 'B "quoted"'}, '::header-image{src="/a.png" alt="B \\"quoted\\""}'],
    ])('should write the attributes %j', (attrs, block) => {
        const editor = createView(header(image, 'Text'));
        expect(runCommand(editor, setHeaderImageAttrs(IMAGE_POS, attrs))).toBe(true);
        expect(markup(editor)).toBe(header(block, 'Text'));
    });

    it.each([scriptUrl, 'data:image/png;base64,AAAA', ' '])(
        'should reject the unsafe address %j',
        (src) => {
            const editor = createView(header(image, 'Text'));
            const {doc} = editor.state;
            expect(runCommand(editor, setHeaderImageAttrs(IMAGE_POS, {src}))).toBe(false);
            expect(editor.state.doc).toBe(doc);
        },
    );

    it('should not change another node', () => {
        const editor = createView(header(image, 'Text'));
        const {doc} = editor.state;
        expect(runCommand(editor, setHeaderImageAttrs(IMAGE_POS + 1, {alt: 'B'}))).toBe(false);
        expect(runCommand(editor, removeHeaderImage(IMAGE_POS + 1))).toBe(false);
        expect(editor.state.doc).toBe(doc);
    });

    it('should undo each change of the image in one step', () => {
        const editor = createView(header(image, 'Text'));
        runCommand(editor, setHeaderImageAttrs(IMAGE_POS, {alt: 'B'}));
        runCommand(editor, setHeaderImageAttrs(IMAGE_POS, {src: '/b.png', title: 'T'}));
        runCommand(editor, undo);
        expect(markup(editor)).toBe(header('::header-image{src="/a.png" alt="B"}', 'Text'));
    });

    it.each([
        ['the first block', [image, 'Text'], ['Text'], 'Text'],
        ['the last block', ['Text', image], ['Text'], 'Text'],
        ['between blocks', ['Text', image, 'More'], ['Text', 'More'], 'More'],
        ['the only block', [image], [], ''],
    ])('should remove the image that is %s', (_name, before, after, text) => {
        const editor = createView(`${header(...before)}\n\nAfter`);
        let pos = -1;
        editor.state.doc.descendants((node, offset) => {
            if (node.type.name === headerImageNodeName) pos = offset;
        });
        expect(runCommand(editor, removeHeaderImage(pos))).toBe(true);
        expect(markup(editor)).toBe(`${header(...after)}\n\nAfter`);
        const {selection} = editor.state;
        expect(selection).toBeInstanceOf(TextSelection);
        expect(selection.$from.parent.textContent).toBe(text);
        expect(selection.$from.node(1).type.name).toBe('header');
    });
});

describe('Header image keys', () => {
    it.each([
        ['Backspace at the start of the text after the image', [image, 'Text'], false, 'Backspace'],
        ['Delete at the end of the text before the image', ['Text', image], true, 'Delete'],
    ])('should select the image on %s', (_name, blocks, end, key) => {
        const editor = createView(header(...blocks));
        const {doc} = editor.state;
        setCursor(editor, textPos(editor, 'Text', end));
        expect(press(editor, key)).toBe(true);
        expect(editor.state.doc).toBe(doc);
        expect(selectedHeaderImage(editor.state)).not.toBeNull();
    });

    it.each([
        ['Backspace in the middle of the text', 'Backspace', 2],
        ['Delete in the middle of the text', 'Delete', 2],
    ])('should leave %s to the editor', (_name, key, offset) => {
        const editor = createView(header(image, 'Text'));
        setCursor(editor, textPos(editor, 'Text') + offset);
        press(editor, key);
        expect(selectedHeaderImage(editor.state)).toBeNull();
        expect(countImages(editor)).toBe(1);
    });

    it.each(['Backspace', 'Delete'])('should remove the selected image on %s', (key) => {
        const editor = createView(`Before\n\n${header('Text', image, 'More')}\n\nAfter`);
        selectNode(editor, textPos(editor, 'Text', true) + 1);
        expect(press(editor, key)).toBe(true);
        expect(markup(editor)).toBe(`Before\n\n${header('Text', 'More')}\n\nAfter`);
        runCommand(editor, undo);
        expect(countImages(editor)).toBe(1);
    });

    it.each(['Backspace', 'Delete'])(
        'should keep the banner when its only image is removed on %s',
        (key) => {
            const editor = createView(`${header(image)}\n\nAfter`);
            selectNode(editor, IMAGE_POS);
            expect(press(editor, key)).toBe(true);
            expect(markup(editor)).toBe(`${header()}\n\nAfter`);
            expect(editor.state.selection.$from.node(1).type.name).toBe('header');
        },
    );
});

describe('Header image click', () => {
    const pressOn = (target: Element, init: MouseEventInit = {}) => {
        const event = new MouseEvent('mousedown', {
            bubbles: true,
            cancelable: true,
            button: 0,
            ...init,
        });
        target.dispatchEvent(event);
        return event;
    };

    it.each([
        ['an image that is selected', image, true],
        ['an image that is not selected', image, false],
        ['a placeholder that is selected', emptyImage, true],
        ['a placeholder that is not selected', emptyImage, false],
    ])('should select %s and keep the page selection', (_name, block, selected) => {
        const editor = createView(header(block, 'Text'));
        if (selected) selectNode(editor, IMAGE_POS);
        else setCursor(editor, textPos(editor, 'Text'));
        const event = pressOn(imageDom(editor));
        expect(event.defaultPrevented).toBe(true);
        expect(editor.state.selection).toBeInstanceOf(NodeSelection);
        expect(selectedHeaderImage(editor.state)?.pos).toBe(IMAGE_POS);
    });

    it('should select the placeholder on a press on its icon', () => {
        const editor = createView(header(emptyImage, 'Text'));
        setCursor(editor, textPos(editor, 'Text'));
        const icon = document.createElement('svg');
        imageDom(editor).append(icon);
        expect(pressOn(icon).defaultPrevented).toBe(true);
        expect(selectedHeaderImage(editor.state)?.pos).toBe(IMAGE_POS);
    });

    // The editor handles these presses itself, and it needs a layout that jsdom lacks.
    it.each([{button: 2}, {shiftKey: true}, {ctrlKey: true}, {metaKey: true}])(
        'should leave the press %j to the editor',
        (init) => {
            const editor = createView(header(image, 'Text'));
            setCursor(editor, textPos(editor, 'Text'));
            const event = new MouseEvent('mousedown', {cancelable: true, button: 0, ...init});
            Object.defineProperty(event, 'target', {value: imageDom(editor)});
            const handled = editor.someProp('handleDOMEvents', (handlers) =>
                handlers.mousedown?.(editor, event),
            );
            expect(handled).toBeFalsy();
            expect(event.defaultPrevented).toBe(false);
            expect(selectedHeaderImage(editor.state)).toBeNull();
        },
    );
});

describe('Header image guard', () => {
    const imageNode = (editor: EditorView, src: string) =>
        headerImageNodeType(editor.state.schema).create({src});

    it('should reject a second image in a banner', () => {
        const editor = createView(header(image, 'Text'));
        const {doc} = editor.state;
        const end = textPos(editor, 'Text', true) + 1;
        editor.dispatch(editor.state.tr.insert(end, imageNode(editor, '/b.png')));
        expect(editor.state.doc).toBe(doc);
    });

    it('should reject a pasted image in a banner with an image', () => {
        const editor = createView(header(image, 'Text'));
        const {doc} = editor.state;
        setCursor(editor, textPos(editor, 'Text', true));
        const slice = new Slice(Fragment.from(imageNode(editor, '/b.png')), 0, 0);
        editor.dispatch(editor.state.tr.replaceSelection(slice));
        expect(editor.state.doc).toBe(doc);
    });

    it.each([
        ['into a banner without an image', header('Text'), 1],
        ['outside a banner', `${header(image)}\n\nAfter`, 2],
    ])('should accept an image %s', (_name, source, count) => {
        const editor = createView(source);
        const end = textPos(editor, source.includes('After') ? 'After' : 'Text', true) + 1;
        editor.dispatch(editor.state.tr.insert(end, imageNode(editor, '/b.png')));
        expect(countImages(editor)).toBe(count);
    });

    it('should accept a change of the attributes of the image', () => {
        const editor = createView(header(image, 'Text'));
        expect(runCommand(editor, setHeaderImageAttrs(IMAGE_POS, {alt: 'B'}))).toBe(true);
        expect(markup(editor)).toBe(header('::header-image{src="/a.png" alt="B"}', 'Text'));
    });
});

describe('Header image switch', () => {
    it('should insert a placeholder before the text', () => {
        const editor = createView(header('Text'));
        expect(runCommand(editor, toggleHeaderPart(0, 'image', true, new Map()))).toBe(true);
        expect(markup(editor)).toBe(header(emptyImage, 'Text'));
        expect(runCommand(editor, toggleHeaderPart(0, 'image', true, new Map()))).toBe(false);
    });

    it.each([emptyImage, image])('should remove and restore the same node of %j', (block) => {
        const editor = createView(header(block, 'Text'));
        const node = editor.state.doc.child(0).child(0);
        const removed: RemovedParts = new Map();
        expect(runCommand(editor, toggleHeaderPart(0, 'image', false, removed))).toBe(true);
        expect(markup(editor)).toBe(header('Text'));
        expect(runCommand(editor, toggleHeaderPart(0, 'image', true, removed))).toBe(true);
        expect(editor.state.doc.child(0).child(0)).toBe(node);
    });

    it('should restore the address and the texts of the removed image', () => {
        const block = '::header-image{src="/a.png" alt="A" title="T"}';
        const editor = createView(header('Text', block, 'More'));
        const removed: RemovedParts = new Map();
        runCommand(editor, toggleHeaderPart(0, 'image', false, removed));
        expect(markup(editor)).toBe(header('Text', 'More'));
        runCommand(editor, toggleHeaderPart(0, 'image', true, removed));
        expect(markup(editor)).toBe(header(block, 'Text', 'More'));
    });

    it('should insert a placeholder in place of the only empty paragraph', () => {
        const editor = createView(header(''));
        runCommand(editor, toggleHeaderPart(0, 'image', true, new Map()));
        expect(markup(editor)).toBe(header(emptyImage));
    });

    it('should switch the image in one undo step', () => {
        const editor = createView(header('Text'));
        runCommand(editor, toggleHeaderPart(0, 'image', true, new Map()));
        runCommand(editor, undo);
        expect(markup(editor)).toBe(header('Text'));
    });
});
