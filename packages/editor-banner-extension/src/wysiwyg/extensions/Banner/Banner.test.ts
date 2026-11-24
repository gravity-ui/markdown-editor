// @vitest-environment jsdom
import {EditorState as MarkupEditorState} from '@gravity-ui/markdown-editor/cm/state';
import {ExtensionsManager} from '@gravity-ui/markdown-editor/core';
import {
    Clipboard,
    ReactRenderStorage,
    ReactRendererExtension,
} from '@gravity-ui/markdown-editor/extensions';
import {history, redo, undo} from '@gravity-ui/markdown-editor/pm/history';
import {DOMParser, DOMSerializer, Schema} from '@gravity-ui/markdown-editor/pm/model';
import {
    AllSelection,
    type Command,
    EditorState,
    NodeSelection,
    TextSelection,
} from '@gravity-ui/markdown-editor/pm/state';
import {builders} from '@gravity-ui/markdown-editor/pm/test-builder';
import {EditorView} from '@gravity-ui/markdown-editor/pm/view';
import {
    BaseNode,
    BaseSchemaSpecs,
    BlockquoteSpecs,
    BoldSpecs,
    CodeBlockSpecs,
    LinkSpecs,
    ListsSpecs,
    boldMarkName,
} from '@gravity-ui/markdown-editor/specs';
import {type BannerDimensions, bannerDefaults} from '@gravity-ui/markdown-plugin-banner';
import {afterEach, describe, expect, it, vi} from 'vitest';

import {insertBanner as insertBannerMarkup} from '../../../markup/commands/insertBanner';
import {bannerUploadPlugin, uploadBannerFile} from '../../plugins/BannerUploadPlugin';
import {selectionInside} from '../../plugins/SelectionInsidePlugin/plugin';

import {BannerSpecs, bannerNodeName} from './BannerSpecs';
import {insertBanner, removeBanner, setBannerDimension, toggleBannerPart} from './commands';
import type {BannerPartSpec} from './parts';

import {Banner} from '.';

const {schema, markupParser, serializer} = new ExtensionsManager({
    extensions: (builder) =>
        builder
            .use(BaseSchemaSpecs, {})
            .use(BoldSpecs)
            .use(LinkSpecs)
            .use(BlockquoteSpecs)
            .use(ListsSpecs)
            .use(CodeBlockSpecs, {})
            .use(BannerSpecs),
}).buildDeps();

let view: EditorView | undefined;
afterEach(() => {
    view?.destroy();
    view = undefined;
});

function createView(markup = ':::banner\n:::') {
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
                .use(Banner),
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

describe('Banner extension', () => {
    it.each<BannerDimensions>([
        {height: 's', width: 'm'},
        {height: 'm', width: 's'},
        {height: 'l', width: 'full'},
    ])('should round trip %j', ({height, width}) => {
        const source = `:::banner{height="${height}" width="${width}"}\n\n:::`;
        const doc = markupParser.parse(source);
        expect(doc.firstChild?.attrs).toEqual({height, width});
        expect(serializer.serialize(doc)).toBe(source);
        const container = document.createElement('div');
        container.append(DOMSerializer.fromSchema(schema).serializeFragment(doc.content));
        expect(DOMParser.fromSchema(schema).parse(container).toJSON()).toEqual(doc.toJSON());
    });

    it('should parse and serialize the document tree', () => {
        const {doc, p, b, banner} = builders<'doc' | 'p' | 'banner', 'b'>(schema, {
            doc: {nodeType: BaseNode.Doc},
            p: {nodeType: BaseNode.Paragraph},
            b: {markType: boldMarkName},
            banner: {nodeType: bannerNodeName, height: 'm', width: 's'},
        });
        const markup = ':::banner{height="m" width="s"}\n\nKeep **text**\n\n:::\n\nAfter';
        const expected = doc(banner(p('Keep ', b('text'))), p('After'));
        expect(markupParser.parse(markup).toJSON()).toEqual(expected.toJSON());
        expect(serializer.serialize(expected)).toBe(markup);
    });

    it('should use the same defaults in the schema and parser', () => {
        expect(schema.nodes.banner.create().attrs).toEqual(bannerDefaults);
        expect(markupParser.parse(':::banner\n:::').firstChild?.attrs).toEqual(bannerDefaults);
    });

    it('should clamp only the moving end of a selection that starts inside the banner', () => {
        const editor = createView('Before\n\n:::banner\nInside\n:::\n\nAfter');
        const {doc} = editor.state;
        const start = doc.child(0).nodeSize;
        const end = start + doc.child(1).nodeSize;
        const select = (anchor: number, head: number) =>
            selectionInside((s) => s.nodes.banner)(editor, doc.resolve(anchor), doc.resolve(head));
        expect(select(start + 3, start - 1)).toMatchObject({anchor: start + 3, head: start + 2});
        expect(select(start + 3, end + 1)).toMatchObject({anchor: start + 3, head: end - 2});
        expect(select(end + 1, start + 3)).toBeNull();
        expect(select(start + 3, start - 2)).toBeNull();
    });

    it('should consume a saved part so a later deletion cannot restore stale text', () => {
        const part: BannerPartSpec = {part: 'title', create: (type) => type.create()};
        const partsSchema = new Schema({
            nodes: schema.spec.nodes.addToEnd('testTitle', {
                group: 'block',
                content: 'text*',
                bannerPart: part,
            }),
            marks: schema.spec.marks,
        });
        const title = partsSchema.node('testTitle', null, partsSchema.text('Saved title'));
        let state = EditorState.create({
            doc: partsSchema.node('doc', null, [
                partsSchema.node('banner', null, [title, partsSchema.node('paragraph')]),
            ]),
        });
        const removed = new Map();
        const toggle = (enabled: boolean) =>
            toggleBannerPart(
                0,
                'title',
                enabled,
                removed,
            )(state, (tr) => {
                state = state.apply(tr);
            });
        expect(toggle(false)).toBe(true);
        expect(toggle(true)).toBe(true);
        expect(state.doc.firstChild?.firstChild).toBe(title);
        state = state.apply(state.tr.delete(1, 1 + title.nodeSize));
        expect(toggle(true)).toBe(true);
        expect(state.doc.firstChild?.firstChild?.textContent).toBe('');
    });

    it('should insert the same dimensions in both editor modes', () => {
        const state = MarkupEditorState.create();
        let markup = '';
        insertBannerMarkup({
            state,
            dispatch: (tr) => {
                markup = tr.state.doc.toString();
            },
        });
        expect(markupParser.parse(markup).firstChild?.attrs).toEqual(
            schema.nodes.banner.create().attrs,
        );
    });

    it('should skip an unsupported attribute and use the default for an unsupported value', () => {
        expect(
            serializer.serialize(markupParser.parse(':::banner{height="xl" color="red"}\n:::')),
        ).toBe(':::banner{height="s" width="m"}\n\n:::');
    });

    it.each([
        ':::banner\nText **with formatting**\n:::',
        ':::banner\nText!\n[link](url)\n\n:::',
        '> :::banner\n> Text\n> :::',
        '- :::banner\n  Text\n  :::',
    ])('should round trip child blocks in %j', (markup) => {
        const doc = markupParser.parse(markup);
        expect(markupParser.parse(serializer.serialize(doc)).toJSON()).toEqual(doc.toJSON());
    });

    it.each([':::banner\n- a\n- b\n:::', ':::banner\n1. a\n2. b\n:::', ':::banner\n> a\n:::'])(
        'should close the banner right after a child block in %j',
        (markup) => {
            const doc = markupParser.parse(markup);
            expect(doc.childCount).toBe(1);
            expect(doc.child(0).type.name).toBe('banner');
            expect(doc.child(0).childCount).toBe(1);
        },
    );

    it('should preserve child blocks when changing dimensions', () => {
        const editor = createView(':::banner\nKeep **text**\n:::');
        const content = editor.state.doc.child(0).content;
        expect(run(editor, setBannerDimension(0, 'height', 'l'))).toBe(true);
        expect(editor.state.doc.child(0).content.eq(content)).toBe(true);
        const container = document.createElement('div');
        container.append(
            DOMSerializer.fromSchema(schema).serializeFragment(editor.state.doc.content),
        );
        expect(DOMParser.fromSchema(schema).parse(container).eq(editor.state.doc)).toBe(true);
    });

    it.each(['\n', '<br>'])('should preserve an empty HTML banner containing %j', (content) => {
        const container = document.createElement('div');
        container.innerHTML =
            '<div class="g-md-banner-plugin" data-height="l" data-width="full">' +
            content +
            '</div>';
        const doc = DOMParser.fromSchema(schema).parse(container);
        expect(doc.firstChild?.type.name).toBe('banner');
        expect(doc.firstChild?.attrs).toEqual({height: 'l', width: 'full'});
    });

    it('should remove a banner', () => {
        const editor = createView(':::banner{height="m" width="s"}\n:::\n\nAfter');
        expect(run(editor, removeBanner(1))).toBe(false);
        expect(run(editor, removeBanner(0))).toBe(true);
        expect(serializer.serialize(editor.state.doc)).toBe('After');
    });

    it('should update dimensions independently and undo each change', () => {
        const editor = createView();
        expect(run(editor, setBannerDimension(0, 'height', 'l'))).toBe(true);
        expect(run(editor, setBannerDimension(0, 'width', 'full'))).toBe(true);
        expect(dimensions(editor)).toEqual({height: 'l', width: 'full'});
        expect(undo(editor.state, editor.dispatch)).toBe(true);
        expect(dimensions(editor)).toEqual({height: 'l', width: 'm'});
        expect(undo(editor.state, editor.dispatch)).toBe(true);
        expect(dimensions(editor)).toEqual({height: 's', width: 'm'});
        expect(redo(editor.state, editor.dispatch)).toBe(true);
        expect(dimensions(editor)).toEqual({height: 'l', width: 'm'});
    });

    it('should insert an empty banner and undo the insertion', () => {
        const editor = createView('');
        editor.dispatch(editor.state.tr.setSelection(TextSelection.create(editor.state.doc, 1)));
        expect(run(editor, insertBanner)).toBe(true);
        expect(editor.state.doc.firstChild?.type.name).toBe('banner');
        expect(dimensions(editor)).toEqual(bannerDefaults);
        expect(undo(editor.state, editor.dispatch)).toBe(true);
        expect(editor.state.doc.firstChild?.type.name).toBe('paragraph');
    });

    it('should keep the typed text inside a banner inserted into an empty document', () => {
        const editor = createView('');
        editor.dispatch(editor.state.tr.setSelection(TextSelection.create(editor.state.doc, 1)));
        expect(run(editor, insertBanner)).toBe(true);
        editor.dispatch(editor.state.tr.insertText('x'));
        expect(editor.state.doc.childCount).toBe(1);
        expect(editor.state.doc.firstChild?.type.name).toBe('banner');
        expect(editor.state.doc.firstChild?.textContent).toBe('x');
    });

    it('should split a paragraph at the cursor when inserting a banner', () => {
        const editor = createView('abcdef');
        editor.dispatch(editor.state.tr.setSelection(TextSelection.create(editor.state.doc, 4)));
        expect(run(editor, insertBanner)).toBe(true);
        expect(editor.state.doc.child(0).textContent).toBe('abc');
        expect(editor.state.doc.child(1).type.name).toBe('banner');
        expect(editor.state.doc.child(2).textContent).toBe('def');
        expect(editor.state.selection.$from.node(1).type.name).toBe('banner');
    });

    it.each([1, 4])('should put the cursor into a banner inserted at position %i', (pos) => {
        const editor = createView('abc');
        editor.dispatch(editor.state.tr.setSelection(TextSelection.create(editor.state.doc, pos)));
        expect(run(editor, insertBanner)).toBe(true);
        expect(editor.state.doc.textContent).toBe('abc');
        expect(editor.state.selection.$from.node(1).type.name).toBe('banner');
    });

    it('should not insert a banner inside a banner', () => {
        const editor = createView(':::banner\nText\n:::');
        editor.dispatch(editor.state.tr.setSelection(TextSelection.create(editor.state.doc, 2)));
        expect(insertBanner(editor.state)).toBe(false);
    });

    it('should copy only the selected text inside a banner', () => {
        const deps = new ExtensionsManager({
            extensions: (builder) =>
                builder.use(BaseSchemaSpecs, {}).use(Clipboard, {}).use(BannerSpecs),
        }).build();
        const editor = new EditorView(document.createElement('div'), {
            state: EditorState.create({
                schema: deps.schema,
                doc: deps.markupParser.parse(':::banner\nOne\n\nTwo\n:::'),
                plugins: deps.plugins,
            }),
        });
        view = editor;
        // From "ne" in the first paragraph to "Tw" in the second one.
        editor.dispatch(editor.state.tr.setSelection(TextSelection.create(editor.state.doc, 3, 9)));
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
            expect(insertBanner(editor.state)).toBe(false);
            expect(run(editor, insertBanner)).toBe(false);
            expect(editor.state.doc).toBe(doc);
        }
    });

    it('should preserve the selected-node class after changing dimensions', () => {
        const editor = createNodeView('Before\n\n:::banner\n:::');
        const pos = editor.state.doc.child(0).nodeSize;
        editor.dispatch(editor.state.tr.setSelection(NodeSelection.create(editor.state.doc, pos)));
        expect(run(editor, setBannerDimension(pos, 'height', 'l'))).toBe(true);
        expect(
            (editor.nodeDOM(pos) as HTMLElement).classList.contains('ProseMirror-selectednode'),
        ).toBe(true);
        expect(editor.state.selection).toBeInstanceOf(NodeSelection);
    });

    it('should settle pending uploads as soon as the editor is destroyed', async () => {
        const editor = createView();
        editor.updateState(editor.state.reconfigure({plugins: [bannerUploadPlugin()]}));
        const setImage = vi.fn();
        let finish!: (result: {url: string}) => void;
        const response = new Promise<{url: string}>((resolve) => {
            finish = resolve;
        });
        const result = uploadBannerFile(
            editor,
            0,
            new File([], 'banner.png'),
            () => response,
            setImage,
        );

        editor.destroy();
        await expect(result).resolves.toBe(false);
        finish({url: 'https://example.com/banner.png'});
        await response;
        expect(setImage).not.toHaveBeenCalled();
    });

    it('should apply content DOM edits to the document', async () => {
        const editor = createNodeView(':::banner\nBefore\n:::');
        const paragraph = (editor.nodeDOM(0) as HTMLElement).querySelector(':scope > p');
        expect(paragraph).not.toBeNull();
        paragraph?.replaceChildren(document.createTextNode('After'));
        await expect.poll(() => editor.state.doc.firstChild?.textContent).toBe('After');
    });
});
