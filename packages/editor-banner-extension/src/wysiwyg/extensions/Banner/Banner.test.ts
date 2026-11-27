// @vitest-environment jsdom
import {EditorState as MarkupEditorState} from '@gravity-ui/markdown-editor/cm/state';
import {ExtensionsManager} from '@gravity-ui/markdown-editor/core';
import {
    BaseKeymap,
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
import {builders} from '@gravity-ui/markdown-editor/pm/test-builder';
import {EditorView} from '@gravity-ui/markdown-editor/pm/view';
import {
    BaseNode,
    BaseSchemaSpecs,
    BlockquoteSpecs,
    BoldSpecs,
    CodeBlockSpecs,
    HeadingSpecs,
    LinkSpecs,
    ListsSpecs,
    boldMarkName,
} from '@gravity-ui/markdown-editor/specs';
import {
    type BannerDimensions,
    bannerBackgroundDefaults,
    bannerContentTokenName,
    bannerDefaults,
    bannerImageTokenName,
} from '@gravity-ui/markdown-plugin-banner';
import {afterEach, describe, expect, it, vi} from 'vitest';

import {insertBanner as insertBannerMarkup} from '../../../markup/commands/insertBanner';
import {nodeUploadPlugin, uploadNodeFile} from '../../plugins/NodeUploadPlugin';

import {BannerSpecs, bannerNodeName} from './BannerSpecs';
import {
    bannerBackgroundSources,
    insertBanner,
    removeBanner,
    setBannerBackground,
    setBannerDimension,
} from './commands';

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
            .use(HeadingSpecs, {})
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
        state: EditorState.create({schema, doc, plugins: [history(), nodeUploadPlugin()]}),
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
                .use(Banner)
                .use(BaseKeymap),
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
        expect(doc.firstChild?.attrs).toEqual({height, width, ...bannerBackgroundDefaults});
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

    it('should preserve all banner directives after a visual edit', () => {
        const markup = [
            ':::banner{height="s" width="m"}',
            '::banner-title[Portal]{size="1" color="blue"}',
            ':::banner-content\n\nFirst **paragraph**\n\nSecond paragraph\n\n:::',
            '::banner-image[Team](/team.png "Our team")',
            ':::',
        ].join('\n\n');
        const editor = createView(markup);
        editor.dispatch(editor.state.tr.insertText(' [A]', 2 + 'Portal'.length));
        const edited = serializer.serialize(editor.state.doc);
        expect(edited).toBe(markup.replace('Portal', 'Portal \\[A\\]'));
        expect(markupParser.parse(edited).eq(editor.state.doc)).toBe(true);

        const container = document.createElement('div');
        container.append(
            DOMSerializer.fromSchema(schema).serializeFragment(editor.state.doc.content),
        );
        expect(container.querySelector('h1.g-md-banner-title-plugin')?.textContent).toBe(
            'Portal [A]',
        );
        expect(DOMParser.fromSchema(schema).parse(container).eq(editor.state.doc)).toBe(true);
    });

    it.each([
        ['Enter', 4],
        ['Delete', 7],
        ['Backspace', 10],
    ] as const)('should keep the title and description when pressing %s', (key, cursor) => {
        const editor = createNodeView(
            ':::banner\n::banner-title[Title]\n:::banner-content\nDescription\n:::\n:::',
        );
        const {doc, tr} = editor.state;
        editor.dispatch(tr.setSelection(TextSelection.create(doc, cursor)));
        editor.dom.dispatchEvent(
            new KeyboardEvent('keydown', {key, bubbles: true, cancelable: true}),
        );
        expect(editor.state.doc.eq(doc)).toBe(true);
    });

    it('should allow typing into an empty description after reopening it', () => {
        const editor = createView(':::banner\n:::banner-content\n:::\n:::');
        const {doc, tr} = editor.state;
        expect(markupParser.parse(serializer.serialize(doc)).eq(doc)).toBe(true);
        const cursor = TextSelection.atStart(doc);
        expect(cursor.$from.parent.type.name).toBe(BaseNode.Paragraph);
        editor.dispatch(tr.setSelection(cursor).insertText('Description'));
        expect(editor.state.doc.firstChild?.firstChild?.textContent).toBe('Description');
    });

    it('should preserve image attribute line breaks in a single directive line', () => {
        const source =
            '::banner-image{src="/team.png" alt="First&#10;second" title="First&#13;&#10;second"}';
        const doc = markupParser.parse(source);
        expect(doc.firstChild?.attrs.alt).toBe('First\nsecond');
        expect(doc.firstChild?.attrs.title).toBe('First\r\nsecond');
        const saved = serializer.serialize(doc);
        expect(saved).toBe('::banner-image[First&#10;second](/team.png "First&#13;&#10;second")');
        expect(markupParser.parse(saved).eq(doc)).toBe(true);
    });

    it.each([
        [
            '::banner-image{src="./.files/team.jpg" alt="Team" title="Project team"}',
            '::banner-image[Team](./.files/team.jpg "Project team")',
        ],
        ['::banner-image{src="/team.jpg"}', '::banner-image[](/team.jpg)'],
        ['::banner-image', '::banner-image[]()'],
        [
            String.raw`::banner-image{src="/a(1).png" alt="A [B] &amp;amp;" title="Say \"hi\""}`,
            String.raw`::banner-image[A \[B\] &amp;amp;](</a(1).png> "Say \"hi\"")`,
        ],
        ['::banner-image{src="/a&amp;amp;.png"}', '::banner-image[](/a&amp;amp;.png)'],
    ])('should save %s with Markdown image syntax', (source, expected) => {
        const doc = markupParser.parse(source);
        const saved = serializer.serialize(doc);
        expect(saved).toBe(expected);
        expect(markupParser.parse(saved).eq(doc)).toBe(true);
    });

    it('should preserve empty banner directives', () => {
        const parts = ['::banner-title[]', ':::banner-content\n\n:::', '::banner-image[]()'];
        const markup = [':::banner{height="s" width="m"}', ...parts, ':::'].join('\n\n');
        expect(serializer.serialize(markupParser.parse(markup))).toBe(markup);
    });

    it.each(['[A] <tag> &amp;', 'A\\B [C]\\', String.raw`\[escaped\]`])(
        'should preserve edited title text %j across mode changes',
        (text) => {
            const editor = createView(':::banner\n\n::banner-title[Title]\n\n:::');
            editor.dispatch(editor.state.tr.insertText(text, 2, 7));
            const reparsed = markupParser.parse(serializer.serialize(editor.state.doc));
            expect(reparsed.eq(editor.state.doc)).toBe(true);
            expect(reparsed.textContent).toBe(text);
        },
    );

    it.each([
        ':::banner-content\n- One\n- Two\n:::',
        ':::banner-content\n> Quoted **text**\n:::',
        ':::banner-content\n:::banner-content\nNested\n:::\n:::',
        String.raw`::banner-image{src="/team.png?a=1&b=2" alt="A &amp; B \\\"team\\\"" title="[Team]"}`,
    ])('should preserve nested blocks and image attributes in %j', (part) => {
        const doc = markupParser.parse(`:::banner\n\n${part}\n\n:::`);
        expect(doc.firstChild?.firstChild?.type.name).toBe(
            part.startsWith('::banner-image') ? bannerImageTokenName : bannerContentTokenName,
        );
        expect(markupParser.parse(serializer.serialize(doc)).eq(doc)).toBe(true);
    });

    it('should use the same defaults in the schema and parser', () => {
        const defaults = {...bannerDefaults, ...bannerBackgroundDefaults};
        expect(schema.nodes.banner.create().attrs).toEqual(defaults);
        expect(markupParser.parse(':::banner\n:::').firstChild?.attrs).toEqual(defaults);
    });

    it('should preserve query delimiters in background image markup', () => {
        const source =
            ':::banner{height="s" width="m" bg-image="https://cdn.example.com/a.png?w=1200&q=80"}\n\n:::';
        expect(serializer.serialize(markupParser.parse(source))).toBe(source);
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
        expect(doc.firstChild?.attrs).toEqual({
            height: 'l',
            width: 'full',
            ...bannerBackgroundDefaults,
        });
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

    it('should skip dispatch when the dimension is unchanged', () => {
        const editor = createView();
        const state = editor.state;
        expect(run(editor, setBannerDimension(0, 'height', bannerDefaults.height))).toBe(true);
        expect(editor.state).toBe(state);
    });

    it('should skip dispatch when the background is reset to its current value', () => {
        const editor = createView();
        const state = editor.state;
        expect(run(editor, setBannerBackground(0, bannerBackgroundDefaults))).toBe(true);
        expect(editor.state).toBe(state);
    });

    it('should cancel an upload without splitting undo history when the background is unchanged', async () => {
        const editor = createView();
        const file = new File(['image'], 'image.png', {type: 'image/png'});
        const {promise, resolve} = Promise.withResolvers<string>();
        const upload = uploadNodeFile(
            editor,
            0,
            file,
            () => promise,
            (pos, image) => setBannerBackground(pos, {'bg-image': image}),
        );
        editor.dispatch(editor.state.tr.insertText('a', 2));
        expect(run(editor, setBannerBackground(0, bannerBackgroundDefaults))).toBe(true);
        resolve('https://cdn.example.com/image.png');
        expect(await upload).toBe(false);
        expect(editor.state.doc.firstChild?.attrs['bg-image']).toBeNull();

        editor.dispatch(editor.state.tr.insertText('b', 3));
        expect(editor.state.doc.textContent).toBe('ab');
        expect(run(editor, undo)).toBe(true);
        expect(editor.state.doc.textContent).toBe('');
    });

    it('should drop an upload when undo changes the background', async () => {
        const editor = createView();
        expect(run(editor, setBannerBackground(0, {'bg-image': 'https://example.com/a.png'}))).toBe(
            true,
        );
        const {promise, resolve} = Promise.withResolvers<string>();
        const upload = uploadNodeFile(
            editor,
            0,
            new File(['image'], 'b.png', {type: 'image/png'}),
            () => promise,
            (pos, image) => setBannerBackground(pos, {'bg-image': image}),
            {attrs: bannerBackgroundSources},
        );
        expect(run(editor, undo)).toBe(true);
        resolve('https://example.com/b.png');
        expect(await upload).toBe(false);
        expect(editor.state.doc.firstChild?.attrs['bg-image']).toBeNull();
    });

    it('should keep an upload when another attribute of the banner changes', async () => {
        const editor = createView();
        const {promise, resolve} = Promise.withResolvers<string>();
        const upload = uploadNodeFile(
            editor,
            0,
            new File(['image'], 'b.png', {type: 'image/png'}),
            () => promise,
            (pos, image) => setBannerBackground(pos, {'bg-image': image}),
            {attrs: bannerBackgroundSources},
        );
        expect(run(editor, setBannerDimension(0, 'height', 'l'))).toBe(true);
        resolve('https://example.com/b.png');
        expect(await upload).toBe(true);
        expect(editor.state.doc.firstChild?.attrs['bg-image']).toBe('https://example.com/b.png');
    });

    it('should cancel its own upload after the banner moves', async () => {
        const editor = createView();
        const controller = new AbortController();
        const {promise, resolve} = Promise.withResolvers<string>();
        const upload = uploadNodeFile(
            editor,
            0,
            new File(['image'], 'b.png', {type: 'image/png'}),
            () => promise,
            (pos, image) => setBannerBackground(pos, {'bg-image': image}),
            {signal: controller.signal},
        );
        editor.dispatch(editor.state.tr.insert(0, schema.nodes.paragraph.create()));
        controller.abort();
        resolve('https://example.com/b.png');
        expect(await upload).toBe(false);
        expect(editor.state.doc.child(1).attrs['bg-image']).toBeNull();
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

    it('should keep the styles of node decorations when the image changes', () => {
        const editor = createNodeView(':::banner\n:::');
        const dom = editor.nodeDOM(0) as HTMLElement;
        dom.style.outline = '2px solid red';
        const image = 'https://example.com/a.png';
        expect(run(editor, setBannerBackground(0, {'bg-image': image}))).toBe(true);
        expect(dom.style.backgroundImage).toContain(image);
        expect(run(editor, setBannerBackground(0, {'bg-image': null}))).toBe(true);
        expect(dom.style.backgroundImage).toBe('');
        expect(dom.style.outline).toBe('2px solid red');
    });

    it('should settle pending uploads as soon as the editor is destroyed', async () => {
        const editor = createView();
        editor.updateState(editor.state.reconfigure({plugins: [nodeUploadPlugin()]}));
        const setImage = vi.fn();
        let finish!: (url: string) => void;
        const response = new Promise<string>((resolve) => {
            finish = resolve;
        });
        const result = uploadNodeFile(
            editor,
            0,
            new File([], 'banner.png'),
            () => response,
            setImage,
        );

        editor.destroy();
        await expect(result).resolves.toBe(false);
        finish('https://example.com/banner.png');
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
