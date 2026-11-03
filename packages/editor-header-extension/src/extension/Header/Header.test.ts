// @vitest-environment jsdom
import {ExtensionsManager, WysiwygEditor} from '@gravity-ui/markdown-editor/core';
import {ReactRenderStorage, ReactRendererExtension} from '@gravity-ui/markdown-editor/extensions';
import {history, redo, undo} from '@gravity-ui/markdown-editor/pm/history';
import {DOMParser, DOMSerializer} from '@gravity-ui/markdown-editor/pm/model';
import {
    EditorState,
    NodeSelection,
    Plugin,
    TextSelection,
} from '@gravity-ui/markdown-editor/pm/state';
import {EditorView} from '@gravity-ui/markdown-editor/pm/view';
import {BaseSchemaSpecs, BlockquoteSpecs, ListsSpecs} from '@gravity-ui/markdown-editor/specs';
import {afterEach, describe, expect, it} from 'vitest';

import {headerSettingsKey} from './Settings';
import {insertHeader, setHeaderDimensions} from './commands';
import {HeaderSpecs} from './specs';

import {Header} from './index';

const {schema, markupParser, serializer} = new ExtensionsManager({
    extensions: (builder) =>
        builder.use(BaseSchemaSpecs, {}).use(BlockquoteSpecs).use(ListsSpecs).use(HeaderSpecs),
}).buildDeps();

let view: EditorView | undefined;
afterEach(() => {
    view?.destroy();
    view = undefined;
});

function createView(markup = ':::header\n:::', editable = true) {
    const doc = markupParser.parse(markup);
    view = new EditorView(document.createElement('div'), {
        state: EditorState.create({
            schema,
            doc,
            plugins: [history()],
            selection: NodeSelection.create(doc, 0),
        }),
        editable: () => editable,
    });
    return view;
}

function createEditor(initialContent: string) {
    const renderer = new ReactRenderStorage();
    const probe: {view?: EditorView} = {};
    const editor = new WysiwygEditor({
        initialContent,
        extensions: (builder) =>
            builder
                .use(BaseSchemaSpecs, {})
                .use(ReactRendererExtension, renderer)
                .use(Header)
                .addPlugin(
                    () =>
                        new Plugin({
                            view(editorView) {
                                probe.view = editorView;
                                return {};
                            },
                        }),
                ),
    });
    if (!probe.view) throw new Error('Editor view is missing');
    view = probe.view;
    return {editor, renderer, editorView: probe.view};
}

const emptyParagraph = {type: 'paragraph', attrs: {'data-line': null}};
const header = (height: string, width: string) => ({
    type: 'header',
    attrs: {height, width, title: true, description: true},
    content: [
        {type: 'header_title', attrs: {size: '2', color: 'auto'}, content: [emptyParagraph]},
        {type: 'header_content', content: [emptyParagraph]},
    ],
});
const paragraph = (text: string) => ({
    type: 'paragraph',
    attrs: {'data-line': null},
    content: [{type: 'text', text}],
});
const listItem = (markup: string, ...content: object[]) => ({
    type: 'list_item',
    attrs: {markup, 'data-line': null},
    content,
});

describe('Header extension', () => {
    it.each([
        [':::header\n:::', [header('s', 'm')], ':::header{height="s" width="m"}\n:::'],
        [':::header{height="m"}\n:::', [header('m', 'm')], ':::header{height="m" width="m"}\n:::'],
        [
            ':::header{height="l" width="full"}\n:::',
            [header('l', 'full')],
            ':::header{height="l" width="full"}\n:::',
        ],
        [
            'Before\n:::header\n:::\nAfter',
            [paragraph('Before'), header('s', 'm'), paragraph('After')],
            'Before\n\n:::header{height="s" width="m"}\n:::\n\nAfter',
        ],
        [
            ':::header\n:::\n:::header{width="l"}\n:::',
            [header('s', 'm'), header('s', 'l')],
            ':::header{height="s" width="m"}\n:::\n\n:::header{height="s" width="l"}\n:::',
        ],
        [
            '> :::header\n> :::',
            [{type: 'blockquote', content: [header('s', 'm')]}],
            '> :::header{height="s" width="m"}\n> :::',
        ],
        [
            '- :::header{width="s"}\n  :::',
            [
                {
                    type: 'bullet_list',
                    attrs: {tight: false, markup: '-'},
                    content: [listItem('-', header('s', 's'))],
                },
            ],
            '- :::header{height="s" width="s"}\n  :::',
        ],
        [
            '1. Item\n\n   :::header{height="m" width="l"}\n   :::',
            [
                {
                    type: 'ordered_list',
                    attrs: {order: 1, tight: false, markup: '.'},
                    content: [listItem('.', paragraph('Item'), header('m', 'l'))],
                },
            ],
            '1. Item\n\n   :::header{height="m" width="l"}\n   :::',
        ],
        ['::::header\n::::', [paragraph('::::header\n::::')], '\\::::header\n\\::::'],
    ])('should parse supported markup %j', (markup, content, serialized) => {
        const doc = markupParser.parse(markup);
        expect(doc.toJSON()).toEqual({type: 'doc', content});
        expect(serializer.serialize(doc)).toBe(serialized);
        const reparsed = markupParser.parse(serialized);
        expect(reparsed.toJSON()).toEqual(doc.toJSON());
        expect(serializer.serialize(reparsed)).toBe(serialized);
    });

    for (const height of ['s', 'm', 'l']) {
        for (const width of ['s', 'm', 'l', 'full']) {
            it(`should round trip height ${height} and width ${width}`, () => {
                const source = `:::header{height="${height}" width="${width}"}\n:::`;
                const doc = markupParser.parse(source);
                expect(doc.firstChild?.attrs).toMatchObject({height, width});
                expect(doc.firstChild?.textContent).toBe('');
                expect(serializer.serialize(doc)).toBe(source);
                const dom = DOMSerializer.fromSchema(schema).serializeFragment(doc.content);
                const container = document.createElement('div');
                container.append(dom);
                expect(DOMParser.fromSchema(schema).parse(container).toJSON()).toEqual(
                    doc.toJSON(),
                );
            });
        }
    }

    it('should use the same defaults in the schema and parser', () => {
        expect(schema.nodes.header.create().attrs).toMatchObject({height: 's', width: 'm'});
        expect(markupParser.parse(':::header\n:::').firstChild?.attrs).toMatchObject({
            height: 's',
            width: 'm',
        });
        expect(serializer.serialize(markupParser.parse(':::header{width="full"}\n:::'))).toBe(
            ':::header{height="s" width="full"}\n:::',
        );
    });

    it.each([
        ':::header{height="xl"}\n:::',
        ':::header{width="s"width="m"}\n:::',
        ':::header{width="s" width="l"}\n:::',
        ':::header{height="s}\n:::',
        ':::header{onclick="alert(1)"}\n:::',
        ':::header[Title]{width="s"}\nText\n:::',
        ':::header\nText **with formatting**\n:::',
        ':::header\n:::header\n:::\n:::',
        ':::header\nUnclosed text',
        ':::header\n```\n:::\n```\n:::',
        ':::header\nWow!\n[link]\n:::',
        ':::header {height="m"}\n:::',
        ':::header\n::::',
        ':::header\n    :::\n:::',
        ':::header{height="s"} trailing\n:::',
        ':::header{}{}\n:::',
        ':::header{height="m"\n:::',
        ':::header{height="s" height="s"}\n:::',
        ':::header{bg-image="./.files/cover.jpg"}\n\n:::header-title{size="1"}\nTitle\n:::\n\n:::button\n:::\n\n:::',
    ])('should round trip unsupported source without losing data for %s', (markup) => {
        const doc = markupParser.parse(markup);
        expect(doc.firstChild?.type.name).toBe('header_source');
        expect(serializer.serialize(doc)).toBe(markup);
        const container = document.createElement('div');
        container.append(DOMSerializer.fromSchema(schema).serializeFragment(doc.content));
        expect(serializer.serialize(DOMParser.fromSchema(schema).parse(container))).toBe(markup);
    });

    it('should serialize multiple blocks and nested headers without changing boundaries', () => {
        const markup = 'Before\n\n> :::header{height="m" width="s"}\n> :::\n\nAfter';
        expect(serializer.serialize(markupParser.parse(markup))).toBe(markup);
    });

    it('should preserve unsupported source inside a blockquote', () => {
        const source = '> :::header{title="Keep"}\n> Keep **text**\n> :::';
        expect(serializer.serialize(markupParser.parse(source))).toBe(source);
    });

    it('should preserve pasted text instead of accepting a nonempty header element', () => {
        const container = document.createElement('div');
        container.innerHTML =
            '<div class="g-md-header" data-height="s" data-width="m">Keep this text</div>';
        const doc = DOMParser.fromSchema(schema).parse(container);
        expect(doc.textContent).toBe('Keep this text');
        expect(doc.firstChild?.type.name).toBe('paragraph');
    });

    it('should not accept pasted source that is not a header container', () => {
        const container = document.createElement('div');
        container.innerHTML =
            '<pre data-header-source=""><code>&lt;img src=x onerror=alert(1)&gt;</code></pre>';
        const doc = DOMParser.fromSchema(schema).parse(container);
        expect(doc.firstChild?.type.name).not.toBe('header_source');
        expect(doc.textContent).toBe('<img src=x onerror=alert(1)>');
    });

    it('should update dimensions independently and undo each change', () => {
        const editor = createView();
        expect(setHeaderDimensions(editor.state, editor.dispatch, editor, {height: 'l'})).toBe(
            true,
        );
        expect(setHeaderDimensions(editor.state, editor.dispatch, editor, {width: 'full'})).toBe(
            true,
        );
        expect(editor.state.doc.firstChild?.attrs).toMatchObject({height: 'l', width: 'full'});
        expect(undo(editor.state, editor.dispatch)).toBe(true);
        expect(editor.state.doc.firstChild?.attrs).toMatchObject({height: 'l', width: 'm'});
        expect(undo(editor.state, editor.dispatch)).toBe(true);
        expect(editor.state.doc.firstChild?.attrs).toMatchObject({height: 's', width: 'm'});
        expect(redo(editor.state, editor.dispatch)).toBe(true);
        expect(editor.state.doc.firstChild?.attrs).toMatchObject({height: 'l', width: 'm'});
    });

    it('should refuse readonly changes and insertion', () => {
        const editor = createView(':::header\n:::', false);
        expect(setHeaderDimensions(editor.state, editor.dispatch, editor, {height: 'l'})).toBe(
            false,
        );
        expect(insertHeader(editor.state, editor.dispatch, editor)).toBe(false);
        expect(editor.state.doc.firstChild?.attrs).toMatchObject({height: 's', width: 'm'});
    });

    it('should open settings on request and close them when the header is replaced', () => {
        const {editor, renderer, editorView} = createEditor(':::header\n:::\n\nAfter');
        expect(editorView.state.selection).toBeInstanceOf(TextSelection);
        expect(renderer.getItems()).toHaveLength(0);
        editorView.dispatch(
            editorView.state.tr
                .setSelection(NodeSelection.create(editorView.state.doc, 0))
                .setMeta(headerSettingsKey, 0),
        );
        expect(renderer.getItems()).toHaveLength(1);
        editor.actions.setHeaderDimensions.run({height: 'l'});
        expect(editor.doc.firstChild?.attrs).toMatchObject({height: 'l', width: 'm'});
        expect(renderer.getItems()).toHaveLength(1);
        editor.replace(':::header\n:::');
        expect(editorView.state.selection).toBeInstanceOf(TextSelection);
        expect(renderer.getItems()).toHaveLength(0);
    });

    it('should remove settings when an editable view becomes readonly', () => {
        const {editor, renderer, editorView} = createEditor(':::header\n:::');
        editorView.dispatch(
            editorView.state.tr
                .setSelection(NodeSelection.create(editorView.state.doc, 0))
                .setMeta(headerSettingsKey, 0),
        );
        expect(renderer.getItems()).toHaveLength(1);
        editorView.setProps({editable: () => false});
        expect(renderer.getItems()).toHaveLength(0);
        editor.actions.setHeaderDimensions.run({height: 'l'});
        expect(editor.doc.firstChild?.attrs).toMatchObject({height: 's', width: 'm'});
    });

    it('should reject invalid dimensions and a non-header selection', () => {
        const editor = createView(':::header\n:::\n\nAfter');
        // @ts-expect-error Unsupported sizes must also be rejected at runtime.
        expect(setHeaderDimensions(editor.state, editor.dispatch, editor, {width: '100%'})).toBe(
            false,
        );
        editor.dispatch(editor.state.tr.setSelection(TextSelection.create(editor.state.doc, 2)));
        expect(setHeaderDimensions(editor.state, editor.dispatch, editor, {height: 'l'})).toBe(
            false,
        );
    });

    it('should insert an empty header and undo the insertion', () => {
        const editor = createView('');
        editor.dispatch(editor.state.tr.setSelection(TextSelection.create(editor.state.doc, 1)));
        expect(insertHeader(editor.state, editor.dispatch, editor)).toBe(true);
        expect(editor.state.doc.firstChild?.type.name).toBe('header');
        expect(editor.state.doc.firstChild?.attrs).toMatchObject({height: 's', width: 'm'});
        expect(undo(editor.state, editor.dispatch)).toBe(true);
        expect(editor.state.doc.firstChild?.type.name).toBe('paragraph');
    });
});
