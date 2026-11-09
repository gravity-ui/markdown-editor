// @vitest-environment jsdom
import {EditorState as MarkupEditorState} from '@gravity-ui/markdown-editor/cm/state';
import {ExtensionsManager} from '@gravity-ui/markdown-editor/core';
import {
    Clipboard,
    ReactRenderStorage,
    ReactRendererExtension,
} from '@gravity-ui/markdown-editor/extensions';
import {history, redo, undo} from '@gravity-ui/markdown-editor/pm/history';
import {DOMParser, DOMSerializer} from '@gravity-ui/markdown-editor/pm/model';
import {
    AllSelection,
    type Command,
    EditorState,
    NodeSelection,
    TextSelection,
} from '@gravity-ui/markdown-editor/pm/state';
import {EditorView} from '@gravity-ui/markdown-editor/pm/view';
import {
    BaseSchemaSpecs,
    BlockquoteSpecs,
    BoldSpecs,
    CodeBlockSpecs,
    LinkSpecs,
    ListsSpecs,
} from '@gravity-ui/markdown-editor/specs';
import {type HeaderDimensions, headerDefaults} from '@gravity-ui/markdown-plugin-header';
import {afterEach, describe, expect, it} from 'vitest';

import {insertHeader as insertHeaderMarkup} from '../../../markup/commands/insertHeader';

import {HeaderSpecs} from './HeaderSpecs';
import {copyHeader, insertHeader, removeHeader, setHeaderDimensions} from './commands';

import {Header} from '.';

const {schema, markupParser, serializer} = new ExtensionsManager({
    extensions: (builder) =>
        builder
            .use(BaseSchemaSpecs, {})
            .use(BoldSpecs)
            .use(LinkSpecs)
            .use(BlockquoteSpecs)
            .use(ListsSpecs)
            .use(CodeBlockSpecs, {})
            .use(HeaderSpecs),
}).buildDeps();

let view: EditorView | undefined;
afterEach(() => {
    view?.destroy();
    view = undefined;
});

function createView(markup = ':::header\n:::') {
    const doc = markupParser.parse(markup);
    view = new EditorView(document.createElement('div'), {
        state: EditorState.create({schema, doc, plugins: [history()]}),
    });
    return view;
}

function run(editor: EditorView, command: Command) {
    return command(editor.state, editor.dispatch, editor);
}

function dimensions(editor: EditorView) {
    const {height, width} = editor.state.doc.firstChild?.attrs ?? {};
    return {height, width};
}

function createNodeView(markup: string) {
    const deps = new ExtensionsManager({
        extensions: (builder) =>
            builder
                .use(BaseSchemaSpecs, {})
                .use(ReactRendererExtension, new ReactRenderStorage())
                .use(Header),
    }).build();
    view = new EditorView(document.createElement('div'), {
        state: EditorState.create({
            schema: deps.schema,
            doc: deps.markupParser.parse(markup),
            plugins: deps.plugins,
        }),
        nodeViews: deps.nodeViews,
    });
    return view;
}

describe('Header extension', () => {
    it.each<HeaderDimensions>([
        {height: 's', width: 'm'},
        {height: 'm', width: 's'},
        {height: 'l', width: 'full'},
    ])('should round trip %j', ({height, width}) => {
        const source = `:::header{height="${height}" width="${width}"}\n\n:::`;
        const doc = markupParser.parse(source);
        expect(doc.firstChild?.attrs).toEqual({height, width});
        expect(serializer.serialize(doc)).toBe(source);
        const container = document.createElement('div');
        container.append(DOMSerializer.fromSchema(schema).serializeFragment(doc.content));
        expect(DOMParser.fromSchema(schema).parse(container).toJSON()).toEqual(doc.toJSON());
    });

    it('should use the same defaults in the schema and parser', () => {
        expect(schema.nodes.header.create().attrs).toEqual(headerDefaults);
        expect(markupParser.parse(':::header\n:::').firstChild?.attrs).toEqual(headerDefaults);
    });

    it('should insert the same dimensions in both editor modes', () => {
        const state = MarkupEditorState.create();
        let markup = '';
        insertHeaderMarkup({
            state,
            dispatch: (tr) => {
                markup = tr.state.doc.toString();
            },
        });
        expect(markupParser.parse(markup).firstChild?.attrs).toEqual(
            schema.nodes.header.create().attrs,
        );
    });

    it('should skip an unsupported attribute and use the default for an unsupported value', () => {
        expect(
            serializer.serialize(markupParser.parse(':::header{height="xl" color="red"}\n:::')),
        ).toBe(':::header{height="s" width="m"}\n\n:::');
    });

    it.each([
        ':::header\nText **with formatting**\n:::',
        ':::header\nText!\n[link](url)\n\n:::',
        '> :::header\n> Text\n> :::',
        '- :::header\n  Text\n  :::',
    ])('should round trip child blocks in %j', (markup) => {
        const doc = markupParser.parse(markup);
        expect(markupParser.parse(serializer.serialize(doc)).toJSON()).toEqual(doc.toJSON());
    });

    it.each([':::header\n- a\n- b\n:::', ':::header\n1. a\n2. b\n:::', ':::header\n> a\n:::'])(
        'should close the header right after a child block in %j',
        (markup) => {
            const doc = markupParser.parse(markup);
            expect(doc.childCount).toBe(1);
            expect(doc.child(0).type.name).toBe('header');
            expect(doc.child(0).childCount).toBe(3);
        },
    );

    it('should preserve child blocks when changing dimensions and copying', () => {
        const editor = createView(':::header\nKeep **text**\n:::');
        const content = editor.state.doc.child(0).content;
        expect(run(editor, setHeaderDimensions(0, {height: 'l'}))).toBe(true);
        expect(editor.state.doc.child(0).content.eq(content)).toBe(true);
        expect(run(editor, copyHeader(0))).toBe(true);
        expect(editor.state.doc.child(1).eq(editor.state.doc.child(0))).toBe(true);
        const container = document.createElement('div');
        container.append(
            DOMSerializer.fromSchema(schema).serializeFragment(editor.state.doc.content),
        );
        expect(DOMParser.fromSchema(schema).parse(container).eq(editor.state.doc)).toBe(true);
    });

    it.each(['\n', '<br>'])('should preserve an empty HTML header containing %j', (content) => {
        const container = document.createElement('div');
        container.innerHTML =
            '<div class="g-md-header-plugin" data-height="l" data-width="full">' +
            content +
            '</div>';
        const doc = DOMParser.fromSchema(schema).parse(container);
        expect(doc.firstChild?.type.name).toBe('header');
        expect(doc.firstChild?.attrs).toEqual({height: 'l', width: 'full'});
    });

    it('should copy and remove a header', () => {
        const editor = createView(':::header{height="m" width="s"}\n:::');
        expect(run(editor, copyHeader(0))).toBe(true);
        expect(serializer.serialize(editor.state.doc)).toBe(
            ':::header{height="m" width="s"}\n\n:::\n\n:::header{height="m" width="s"}\n\n:::',
        );
        expect(run(editor, removeHeader(0))).toBe(true);
        expect(serializer.serialize(editor.state.doc)).toBe(
            ':::header{height="m" width="s"}\n\n:::',
        );
        expect(run(editor, removeHeader(1))).toBe(false);
    });

    it('should update dimensions independently and undo each change', () => {
        const editor = createView();
        expect(run(editor, setHeaderDimensions(0, {height: 'l'}))).toBe(true);
        expect(run(editor, setHeaderDimensions(0, {width: 'full'}))).toBe(true);
        expect(dimensions(editor)).toEqual({height: 'l', width: 'full'});
        expect(undo(editor.state, editor.dispatch)).toBe(true);
        expect(dimensions(editor)).toEqual({height: 'l', width: 'm'});
        expect(undo(editor.state, editor.dispatch)).toBe(true);
        expect(dimensions(editor)).toEqual({height: 's', width: 'm'});
        expect(redo(editor.state, editor.dispatch)).toBe(true);
        expect(dimensions(editor)).toEqual({height: 'l', width: 'm'});
    });

    it('should insert an empty header and undo the insertion', () => {
        const editor = createView('');
        editor.dispatch(editor.state.tr.setSelection(TextSelection.create(editor.state.doc, 1)));
        expect(run(editor, insertHeader)).toBe(true);
        expect(editor.state.doc.firstChild?.type.name).toBe('header');
        expect(dimensions(editor)).toEqual(headerDefaults);
        expect(undo(editor.state, editor.dispatch)).toBe(true);
        expect(editor.state.doc.firstChild?.type.name).toBe('paragraph');
    });

    it('should keep the typed text inside a header inserted into an empty document', () => {
        const editor = createView('');
        editor.dispatch(editor.state.tr.setSelection(TextSelection.create(editor.state.doc, 1)));
        expect(run(editor, insertHeader)).toBe(true);
        editor.dispatch(editor.state.tr.insertText('x'));
        expect(editor.state.doc.childCount).toBe(1);
        expect(editor.state.doc.firstChild?.type.name).toBe('header');
        expect(editor.state.doc.firstChild?.textContent).toBe('x');
    });

    it('should split a paragraph at the cursor when inserting a header', () => {
        const editor = createView('abcdef');
        editor.dispatch(editor.state.tr.setSelection(TextSelection.create(editor.state.doc, 4)));
        expect(run(editor, insertHeader)).toBe(true);
        expect(editor.state.doc.child(0).textContent).toBe('abc');
        expect(editor.state.doc.child(1).type.name).toBe('header');
        expect(editor.state.doc.child(2).textContent).toBe('def');
        expect(editor.state.selection.$from.node(1).type.name).toBe('header');
    });

    it.each([1, 4])('should put the cursor into a header inserted at position %i', (pos) => {
        const editor = createView('abc');
        editor.dispatch(editor.state.tr.setSelection(TextSelection.create(editor.state.doc, pos)));
        expect(run(editor, insertHeader)).toBe(true);
        expect(editor.state.doc.textContent).toBe('abc');
        expect(editor.state.selection.$from.node(1).type.name).toBe('header');
    });

    it('should not insert a header inside a header', () => {
        const editor = createView(':::header\nText\n:::');
        editor.dispatch(editor.state.tr.setSelection(TextSelection.create(editor.state.doc, 6)));
        expect(insertHeader(editor.state)).toBe(false);
    });

    it('should copy only the selected text inside a header', () => {
        const deps = new ExtensionsManager({
            extensions: (builder) =>
                builder.use(BaseSchemaSpecs, {}).use(Clipboard, {}).use(HeaderSpecs),
        }).build();
        const editor = new EditorView(document.createElement('div'), {
            state: EditorState.create({
                schema: deps.schema,
                doc: deps.markupParser.parse(':::header\nOne\n\nTwo\n:::'),
                plugins: deps.plugins,
            }),
        });
        view = editor;
        // From "ne" in the first paragraph to "Tw" in the second one.
        editor.dispatch(
            editor.state.tr.setSelection(TextSelection.create(editor.state.doc, 7, 13)),
        );
        const data = new Map<string, string>();
        const clipboardData = {
            clearData: () => data.clear(),
            setData: (type: string, value: string) => data.set(type, value),
        };
        const event = {clipboardData, preventDefault() {}} as unknown as ClipboardEvent;
        editor.someProp('handleDOMEvents', (handlers) => handlers.copy?.(editor, event));
        expect(data.get('text/yfm')).toBe('ne\n\nTw');
    });

    it('should reject insertion over selected content', () => {
        const editor = createView('abcdef');
        for (const selection of [
            TextSelection.create(editor.state.doc, 1, 4),
            new AllSelection(editor.state.doc),
        ]) {
            editor.dispatch(editor.state.tr.setSelection(selection));
            const doc = editor.state.doc;
            expect(insertHeader(editor.state)).toBe(false);
            expect(run(editor, insertHeader)).toBe(false);
            expect(editor.state.doc).toBe(doc);
        }
    });

    it('should preserve the selected-node class after changing dimensions', () => {
        const editor = createNodeView('Before\n\n:::header\n:::');
        const pos = editor.state.doc.child(0).nodeSize;
        editor.dispatch(editor.state.tr.setSelection(NodeSelection.create(editor.state.doc, pos)));
        expect(run(editor, setHeaderDimensions(pos, {height: 'l'}))).toBe(true);
        expect(
            (editor.nodeDOM(pos) as HTMLElement).classList.contains('ProseMirror-selectednode'),
        ).toBe(true);
        expect(editor.state.selection).toBeInstanceOf(NodeSelection);
    });

    it('should apply content DOM edits to the document', async () => {
        const editor = createNodeView(':::header\n:::header-title\nBefore\n:::\n:::');
        const paragraph = (editor.nodeDOM(0) as HTMLElement).querySelector(
            '.g-md-header-plugin__title p',
        );
        expect(paragraph).not.toBeNull();
        paragraph?.replaceChildren(document.createTextNode('After'));
        await expect.poll(() => editor.state.doc.firstChild?.textContent).toBe('After');
    });
});
