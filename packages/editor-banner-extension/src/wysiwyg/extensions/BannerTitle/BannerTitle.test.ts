// @vitest-environment jsdom
import {DataTransferType} from '@gravity-ui/markdown-editor';
import {ExtensionsManager} from '@gravity-ui/markdown-editor/core';
import {ReactRenderStorage, ReactRendererExtension} from '@gravity-ui/markdown-editor/extensions';
import {Fragment, Slice} from '@gravity-ui/markdown-editor/pm/model';
import {EditorState, TextSelection} from '@gravity-ui/markdown-editor/pm/state';
import {EditorView} from '@gravity-ui/markdown-editor/pm/view';
import {
    BaseSchemaSpecs,
    BoldSpecs,
    HeadingSpecs,
    ListsSpecs,
    boldMarkName,
} from '@gravity-ui/markdown-editor/specs';
import {afterEach, describe, expect, it, vi} from 'vitest';

import {Banner} from '../Banner';
import {type RemovedParts, toggleBannerPart} from '../Banner/commands';

import {bannerTitleNodeName} from './BannerTitleSpecs';
import {setBannerTitleAttrs} from './commands';

const deps = new ExtensionsManager({
    extensions: (builder) =>
        builder
            .use(BaseSchemaSpecs, {})
            .use(BoldSpecs)
            .use(HeadingSpecs, {})
            .use(ListsSpecs)
            .use(ReactRendererExtension, new ReactRenderStorage())
            .use(Banner, {}),
}).build();
const {schema, markupParser, serializer} = deps;

// 0 banner 1 title 2 "Title" 7 /title 8 p 9 "Text" 13 /p 14 /banner 15
const titled = ':::banner\n::banner-title[Title]\nText\n:::';
const banner = (...blocks: string[]) =>
    [':::banner{height="s" width="m"}', ...blocks, ':::'].join('\n\n');

let view: EditorView | undefined;
afterEach(() => {
    view?.destroy();
    view = undefined;
});

function createView(markup: string, from?: number, to = from) {
    const doc = markupParser.parse(markup);
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

function children(editor: EditorView) {
    const types: string[] = [];
    editor.state.doc.firstChild?.forEach((child) => types.push(child.type.name));
    return types;
}

function clipboard(data: Record<string, string>) {
    return {
        types: Object.keys(data),
        files: [],
        getData: (type: string) => data[type] ?? '',
    } as unknown as DataTransfer;
}

function paste(editor: EditorView, data: Record<string, string>) {
    const event = {clipboardData: clipboard(data), preventDefault: vi.fn()};
    const handled = editor.someProp('handleDOMEvents', (handlers) =>
        handlers.paste?.(editor, event as unknown as ClipboardEvent),
    );
    return {handled: Boolean(handled), prevented: event.preventDefault.mock.calls.length > 0};
}

function drop(editor: EditorView, pos: number) {
    vi.spyOn(editor, 'posAtCoords').mockReturnValue({pos, inside: -1});
    const event = {dataTransfer: clipboard({}), clientX: 0, clientY: 0, preventDefault: vi.fn()};
    const handled = editor.someProp('handleDOMEvents', (handlers) =>
        handlers.drop?.(editor, event as unknown as DragEvent),
    );
    return {handled: Boolean(handled), prevented: event.preventDefault.mock.calls.length > 0};
}

const transformPasted = (editor: EditorView, slice: Slice) =>
    editor.someProp('transformPasted', (transform) => transform(slice, editor)) ?? slice;

describe('Banner title extension', () => {
    describe('specs', () => {
        it.each([
            banner('::banner-title[Title]'),
            banner('::banner-title[Title]{size="4" color="blue"}'),
            banner('::banner-title[a \\[b\\] \\` c\\\\]'),
        ])('should round trip %j', (source) => {
            const doc = markupParser.parse(source);
            expect(doc.firstChild?.firstChild?.type.name).toBe(bannerTitleNodeName);
            expect(serializer.serialize(doc)).toBe(source);
            expect(markupParser.parse(serializer.serialize(doc)).toJSON()).toEqual(doc.toJSON());
        });

        it('should keep the text with a backtick in the title', () => {
            const doc = markupParser.parse(':::banner\n::banner-title[a \\` b]\n:::');
            expect(doc.firstChild?.firstChild?.textContent).toBe('a ` b');
        });

        it('should write a title on one line', () => {
            const title = schema.nodes[bannerTitleNodeName].create(null, schema.text(' a\nb '));
            const doc = schema.node('doc', null, [schema.nodes.banner.create(null, [title])]);
            expect(serializer.serialize(doc)).toBe(banner('::banner-title[a b]'));
        });

        it('should drop an unsupported value', () => {
            expect(
                serializer.serialize(
                    markupParser.parse(':::banner\n::banner-title[T]{size=9 color="pink"}\n:::'),
                ),
            ).toBe(banner('::banner-title[T]'));
        });

        it('should set the title attributes', () => {
            const editor = createView(titled);
            expect(editor.state.doc.nodeAt(1)?.attrs).toEqual({size: 2, color: 'auto'});
            expect(setBannerTitleAttrs(0, {size: 3})(editor.state)).toBe(false);
            expect(
                setBannerTitleAttrs(1, {size: 5, color: 'blue'})(editor.state, editor.dispatch),
            ).toBe(true);
            expect(editor.state.doc.nodeAt(1)?.attrs).toEqual({size: 5, color: 'blue'});
        });
    });

    describe('guard', () => {
        it('should reject a second title in a banner', () => {
            const editor = createView(titled);
            const title = schema.nodes[bannerTitleNodeName].create(null, schema.text('Two'));
            const doc = editor.state.doc;
            editor.dispatch(editor.state.tr.insert(8, title));
            expect(editor.state.doc).toBe(doc);
        });

        it('should keep a banner loaded with two titles editable', () => {
            const title = (text: string) =>
                schema.nodes[bannerTitleNodeName].create(null, schema.text(text));
            const doc = schema.node('doc', null, [
                schema.nodes.banner.create(null, [title('One'), title('Two')]),
            ]);
            const editor = createView('');
            editor.updateState(EditorState.create({schema, doc, plugins: deps.plugins}));
            editor.dispatch(editor.state.tr.insertText('!', 5));
            editor.dispatch(editor.state.tr.insertText('?', 11));
            expect(editor.state.doc.firstChild?.child(0).textContent).toBe('One!');
            expect(editor.state.doc.firstChild?.child(1).textContent).toBe('Two?');
        });

        it('should reject splitting the title', () => {
            const editor = createView(titled);
            const doc = editor.state.doc;
            editor.dispatch(editor.state.tr.split(4));
            expect(editor.state.doc).toBe(doc);
        });

        it('should join the lines of the title text', () => {
            const editor = createView(titled);
            editor.dispatch(editor.state.tr.insertText('\nnext', 7));
            expect(editor.state.doc.nodeAt(1)?.textContent).toBe('Title next');
        });

        it('should type plain text into the title', () => {
            const editor = createView(titled, 7);
            const bold = schema.marks[boldMarkName].create();
            editor.dispatch(editor.state.tr.setStoredMarks([bold]));
            const handled = editor.someProp('handleTextInput', (handler) =>
                handler(editor, 7, 7, '!'),
            );
            expect(handled).toBe(true);
            const title = editor.state.doc.nodeAt(1);
            expect(title?.textContent).toBe('Title!');
            expect(title?.firstChild?.marks).toEqual([]);
        });
    });

    describe('paste and drop', () => {
        it('should paste Markdown text into the title as one line', () => {
            const editor = createView(titled, 7);
            expect(paste(editor, {[DataTransferType.Text]: ' **bold**\n\nnext'})).toEqual({
                handled: true,
                prevented: true,
            });
            expect(editor.state.doc.nodeAt(1)?.textContent).toBe('Title bold next');
            expect(children(editor)).toEqual([bannerTitleNodeName, 'paragraph']);
        });

        it('should paste plain HTML into the title as text', () => {
            const editor = createView(titled, 2);
            paste(editor, {
                [DataTransferType.Text]: 'One\nTwo',
                [DataTransferType.Html]: '<div>One</div><div>Two</div>',
            });
            expect(editor.state.doc.nodeAt(1)?.textContent).toBe('One TwoTitle');
        });

        it('should paste rich HTML into the title as one line', () => {
            const editor = createView(titled, 7);
            editor.pasteHTML(
                '<h2>Head</h2><ul><li><b>One</b></li><li>Two</li></ul>',
                new Event('paste') as ClipboardEvent,
            );
            expect(children(editor)).toEqual([bannerTitleNodeName, 'paragraph']);
            expect(editor.state.doc.nodeAt(1)?.textContent).toBe('TitleHead One Two');
            expect(editor.state.doc.nodeAt(1)?.firstChild?.marks).toEqual([]);
        });

        it('should paste blocks of the editor into the title as one line', () => {
            const editor = createView(titled, 7);
            const result = paste(editor, {[DataTransferType.Yfm]: '# Head\n\n- **one**\n- two'});
            expect(result.prevented).toBe(true);
            expect(editor.state.doc.nodeAt(1)?.textContent).toBe('TitleHead one two');
            expect(markup(editor)).toBe(banner('::banner-title[TitleHead one two]', 'Text'));
        });

        it('should keep the default paste outside the title', () => {
            const editor = createView(titled, 13);
            expect(paste(editor, {[DataTransferType.Text]: 'a\nb'}).handled).toBe(false);
            expect(paste(editor, {[DataTransferType.Yfm]: '# Head'}).handled).toBe(false);
        });

        it('should turn a pasted slice of blocks into one line of text', () => {
            const editor = createView(titled, 7);
            const blocks = new Slice(
                Fragment.from([
                    schema.nodes.paragraph.create(null, schema.text('a')),
                    schema.nodes.paragraph.create(null, schema.text('b')),
                ]),
                1,
                1,
            );
            expect(transformPasted(editor, blocks).content.toJSON()).toEqual([
                {type: 'text', text: 'a b'},
            ]);
        });

        it('should drop blocks into the title as one line of text', () => {
            const editor = createView(titled);
            expect(drop(editor, 4).handled).toBe(false);
            const slice = new Slice(
                Fragment.from(schema.nodes.paragraph.create(null, schema.text('dropped'))),
                0,
                0,
            );
            expect(transformPasted(editor, slice).content.toJSON()).toEqual([
                {type: 'text', text: 'dropped'},
            ]);
            expect(
                editor.someProp('handleDrop', (handler) =>
                    handler(editor, {} as DragEvent, Slice.empty, false),
                ),
            ).toBe(true);
        });

        it('should keep a drop outside the title', () => {
            const editor = createView(titled);
            drop(editor, 10);
            const slice = new Slice(
                Fragment.from(schema.nodes.paragraph.create(null, schema.text('x'))),
                0,
                0,
            );
            expect(transformPasted(editor, slice)).toBe(slice);
        });

        it('should not drag a range that cuts the title', () => {
            const editor = createView(titled, 4, 11);
            Object.assign(editor, {
                dragging: {slice: editor.state.selection.content(), move: true},
            });
            expect(drop(editor, 13)).toEqual({handled: true, prevented: true});
        });
    });

    describe('commands', () => {
        it('should not split the title with Enter', () => {
            const editor = createView(titled, 4);
            expect(press(editor, 'Enter')).toBe(true);
            expect(children(editor)).toEqual([bannerTitleNodeName, 'paragraph']);
            expect(editor.state.doc.nodeAt(1)?.textContent).toBe('Title');
        });

        it('should add a paragraph after a title outside a banner with Enter', () => {
            const title = schema.nodes[bannerTitleNodeName].create(null, schema.text('Title'));
            const doc = schema.node('doc', null, [title]);
            view = new EditorView(document.createElement('div'), {
                state: EditorState.create({
                    schema,
                    doc,
                    plugins: deps.plugins,
                    selection: TextSelection.create(doc, 6),
                }),
            });
            expect(press(view, 'Enter')).toBe(true);
            expect(view.state.doc.childCount).toBe(2);
            expect(view.state.selection.$from.parent.type.name).toBe('paragraph');
        });

        it('should not join the next paragraph with Delete at the end of the title', () => {
            const editor = createView(titled, 7);
            expect(press(editor, 'Delete')).toBe(true);
            expect(markup(editor)).toBe(banner('::banner-title[Title]', 'Text'));
        });

        it('should not join the paragraph with Backspace at its start after the title', () => {
            const editor = createView(titled, 9);
            expect(press(editor, 'Backspace')).toBe(true);
            expect(markup(editor)).toBe(banner('::banner-title[Title]', 'Text'));
        });

        it('should remove an empty paragraph after the title with Backspace', () => {
            const title = schema.nodes[bannerTitleNodeName].create(null, schema.text('Title'));
            const doc = schema.node('doc', null, [
                schema.nodes.banner.create(null, [
                    title,
                    schema.nodes.paragraph.create(),
                    schema.nodes.paragraph.create(null, schema.text('Text')),
                ]),
            ]);
            const editor = createView('');
            editor.updateState(
                EditorState.create({
                    schema,
                    doc,
                    plugins: deps.plugins,
                    selection: TextSelection.create(doc, 9),
                }),
            );
            expect(press(editor, 'Backspace')).toBe(true);
            expect(children(editor)).toEqual([bannerTitleNodeName, 'paragraph']);
            expect(editor.state.selection.from).toBe(7);
        });

        it('should empty the title and keep it when deleting from its start into the text', () => {
            const editor = createView(titled, 2, 11);
            expect(press(editor, 'Backspace')).toBe(true);
            expect(children(editor)).toEqual([bannerTitleNodeName, 'paragraph']);
            expect(editor.state.doc.nodeAt(1)?.textContent).toBe('');
            expect(editor.state.doc.firstChild?.child(1).textContent).toBe('xt');
            expect(editor.state.selection.from).toBe(2);
        });
    });

    describe('Title switch', () => {
        const toggle = (editor: EditorView, enabled: boolean, removed: RemovedParts) =>
            toggleBannerPart(0, 'title', enabled, removed)(editor.state, editor.dispatch);

        it('should insert a title with the default text', () => {
            const editor = createView(':::banner\n:::');
            expect(toggle(editor, true, new Map())).toBe(true);
            expect(children(editor)).toEqual([bannerTitleNodeName]);
            expect(editor.state.doc.firstChild?.textContent).not.toBe('');
        });

        it('should make a title from the only paragraph of plain text', () => {
            const editor = createView(':::banner\nPlain\n:::');
            expect(toggle(editor, true, new Map())).toBe(true);
            expect(children(editor)).toEqual([bannerTitleNodeName]);
            expect(editor.state.doc.firstChild?.textContent).toBe('Plain');
        });

        it('should keep a paragraph with formatting and add a title before it', () => {
            const editor = createView(':::banner\n**Bold**\n:::');
            expect(toggle(editor, true, new Map())).toBe(true);
            expect(children(editor)).toEqual([bannerTitleNodeName, 'paragraph']);
            expect(editor.state.doc.firstChild?.child(1).textContent).toBe('Bold');
        });

        it('should restore the removed title', () => {
            const editor = createView(':::banner\n::banner-title[Mine]{size="3"}\nText\n:::');
            const removed: RemovedParts = new Map();
            expect(toggle(editor, false, removed)).toBe(true);
            expect(children(editor)).toEqual(['paragraph']);
            expect(toggle(editor, true, removed)).toBe(true);
            expect(markup(editor)).toBe(banner('::banner-title[Mine]{size="3"}', 'Text'));
        });
    });
});
