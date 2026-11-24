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
import {
    type BannerBackground,
    type BannerDimensions,
    bannerBackgroundDefaults,
    bannerDefaults,
} from '@gravity-ui/markdown-plugin-banner';
import {afterEach, describe, expect, it} from 'vitest';

import {insertBanner as insertBannerMarkup} from '../../../markup/commands/insertBanner';

import {BannerSpecs, bannerNodeName} from './BannerSpecs';
import {insertBanner, removeBanner, setBannerBackground, setBannerDimension} from './commands';
import {formatImageSize, uploadHint} from './plugins/BannerTooltipPlugin/Settings/utils';
import {cancelBannerUploads, imageFileError, uploadBannerImage} from './plugins/BannerUploadPlugin';

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
                .use(Banner, {}),
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

    it('should use the same defaults in the schema and parser', () => {
        const defaults = {...bannerDefaults, ...bannerBackgroundDefaults};
        expect(schema.nodes.banner.create().attrs).toEqual(defaults);
        expect(markupParser.parse(':::banner\n:::').firstChild?.attrs).toEqual(defaults);
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

    it('should apply content DOM edits to the document', async () => {
        const editor = createNodeView(':::banner\nBefore\n:::');
        const paragraph = (editor.nodeDOM(0) as HTMLElement).querySelector(':scope > p');
        expect(paragraph).not.toBeNull();
        paragraph?.replaceChildren(document.createTextNode('After'));
        await expect.poll(() => editor.state.doc.firstChild?.textContent).toBe('After');
    });

    it('should round trip background attributes with an escaped address', () => {
        const source =
            ':::banner{height="s" width="m" bg-color="blue-light" bg-image="./.files/a \\"b\\" \\\\.jpg" bg-image-theme="dark" bg-image-blur="true"}\n\n:::';
        const doc = markupParser.parse(source);
        expect(doc.firstChild?.attrs).toEqual({
            height: 's',
            width: 'm',
            'bg-color': 'blue-light',
            'bg-image': './.files/a "b" \\.jpg',
            'bg-image-theme': 'dark',
            'bg-image-blur': true,
        });
        expect(serializer.serialize(doc)).toBe(source);
        const container = document.createElement('div');
        container.append(DOMSerializer.fromSchema(schema).serializeFragment(doc.content));
        expect(DOMParser.fromSchema(schema).parse(container).toJSON()).toEqual(doc.toJSON());
    });

    it.each([
        ':::banner{bg-image-theme="system" bg-image-blur="false"}\n:::',
        ':::banner{bg-color="blue" bg-image-theme="sepia"}\n:::',
        ':::banner{bg-image-theme="dark" bg-image-blur="true"}\n:::',
        `:::banner{bg-image="${['javascript', 'alert(1)'].join(':')}"}\n:::`,
        ':::banner{bg-image="data:text/html,<b>"}\n:::',
    ])('should not write default or unsupported background values from %j', (markup) => {
        const doc = markupParser.parse(markup);
        expect(doc.firstChild?.attrs).toEqual({...bannerDefaults, ...bannerBackgroundDefaults});
        expect(serializer.serialize(doc)).toBe(':::banner{height="s" width="m"}\n\n:::');
    });

    it.each(['/image&copy;.png', '/image&amp;name.png', '/image&#10;.png', '/image&#65;.png'])(
        'should preserve literal entity references in the background address %s',
        (url) => {
            const editor = createView();
            run(editor, setBannerBackground(0, {'bg-image': url}));
            const doc = editor.state.doc;
            expect(markupParser.parse(serializer.serialize(doc)).toJSON()).toEqual(doc.toJSON());
        },
    );

    it('should change background attributes in one undo step', () => {
        const editor = createView(':::banner\nText\n:::');
        const background = {
            'bg-color': 'red-heavy',
            'bg-image': '/a.png',
            'bg-image-blur': true,
        } as const;
        expect(run(editor, setBannerBackground(0, background))).toBe(true);
        expect(serializer.serialize(editor.state.doc)).toBe(
            ':::banner{height="s" width="m" bg-color="red-heavy" bg-image="/a.png" bg-image-blur="true"}\n\nText\n\n:::',
        );
        expect(run(editor, setBannerBackground(0, bannerBackgroundDefaults))).toBe(true);
        expect(serializer.serialize(editor.state.doc)).toBe(
            ':::banner{height="s" width="m"}\n\nText\n\n:::',
        );
        expect(undo(editor.state, editor.dispatch)).toBe(true);
        expect(editor.state.doc.firstChild?.attrs['bg-color']).toBe('red-heavy');
        expect(undo(editor.state, editor.dispatch)).toBe(true);
        expect(editor.state.doc.firstChild?.attrs).toEqual({
            ...bannerDefaults,
            ...bannerBackgroundDefaults,
        });
        expect(run(editor, setBannerBackground(2, {'bg-color': 'red-heavy'}))).toBe(false);
    });

    it('should reset the theme and the blur with the image', () => {
        const editor = createView(
            ':::banner{bg-image="/a.png" bg-image-theme="dark" bg-image-blur="true"}\n:::',
        );
        expect(run(editor, setBannerBackground(0, {'bg-image': null}))).toBe(true);
        expect(serializer.serialize(editor.state.doc)).toBe(
            ':::banner{height="s" width="m"}\n\n:::',
        );
    });

    it('should replace the image with a color in one undo step', () => {
        const source =
            ':::banner{height="s" width="m" bg-image="/a.png" bg-image-theme="dark" bg-image-blur="true"}\n\n:::';
        const editor = createView(source);
        const color = {...bannerBackgroundDefaults, 'bg-color': 'blue-light'} as const;
        expect(run(editor, setBannerBackground(0, color))).toBe(true);
        expect(serializer.serialize(editor.state.doc)).toBe(
            ':::banner{height="s" width="m" bg-color="blue-light"}\n\n:::',
        );
        expect(undo(editor.state, editor.dispatch)).toBe(true);
        expect(serializer.serialize(editor.state.doc)).toBe(source);
    });

    it('should render background attributes in the node view and remove them', () => {
        const editor = createNodeView(
            ':::banner{bg-color="green-light" bg-image="/a.png" bg-image-theme="dark" bg-image-blur="true"}\n:::',
        );
        const dom = editor.nodeDOM(0) as HTMLElement;
        expect(Array.from(dom.classList)).toEqual(
            expect.arrayContaining([
                'g-md-banner-plugin_bg-color_green-light',
                'g-md-banner-plugin_bg-image',
                'g-md-banner-plugin_bg-image-blur',
                'g-root',
                'g-root_theme_dark',
            ]),
        );
        expect(dom.getAttribute('data-bg-image')).toBe('/a.png');
        expect(dom.getAttribute('style')).toBe('background-image:url("/a.png")');
        expect(run(editor, setBannerBackground(0, bannerBackgroundDefaults))).toBe(true);
        expect(dom.className).toBe(
            'g-md-banner-nodeview g-md-banner-plugin g-md-banner-plugin_height_s g-md-banner-plugin_width_m',
        );
        expect(dom.hasAttribute('style')).toBe(false);
        expect(dom.getAttributeNames().filter((name) => name.startsWith('data-bg-'))).toEqual([]);
    });

    describe('background upload', () => {
        const file = new File(['image'], 'a.png', {type: 'image/png'});

        function deferred() {
            let resolve!: (result: {url: string}) => void;
            const promise = new Promise<{url: string}>((done) => {
                resolve = done;
            });
            return {handler: () => promise, resolve};
        }

        it('should write the address into the banner moved during the upload', async () => {
            const editor = createNodeView(':::banner\n:::');
            const {handler, resolve} = deferred();
            const upload = uploadBannerImage(editor, 0, file, handler);
            editor.dispatch(
                editor.state.tr.insert(0, editor.state.schema.nodes.paragraph.create()),
            );
            resolve({url: '/a.png'});
            await expect(upload).resolves.toBe(true);
            expect(editor.state.doc.child(1).attrs['bg-image']).toBe('/a.png');
        });

        it('should discard the address when the banner is removed', async () => {
            const editor = createNodeView(':::banner\n:::\n\nAfter');
            const {handler, resolve} = deferred();
            const upload = uploadBannerImage(editor, 0, file, handler);
            editor.dispatch(editor.state.tr.delete(0, editor.state.doc.child(0).nodeSize));
            const doc = editor.state.doc;
            resolve({url: '/a.png'});
            await expect(upload).resolves.toBe(false);
            expect(editor.state.doc).toBe(doc);
        });

        it('should discard the address of an older upload into the same banner', async () => {
            const editor = createNodeView(':::banner\n:::');
            const first = deferred();
            const second = deferred();
            const firstUpload = uploadBannerImage(editor, 0, file, first.handler);
            const secondUpload = uploadBannerImage(editor, 0, file, second.handler);
            first.resolve({url: '/first.png'});
            await expect(firstUpload).resolves.toBe(false);
            expect(editor.state.doc.child(0).attrs['bg-image']).toBeNull();
            second.resolve({url: '/second.png'});
            await expect(secondUpload).resolves.toBe(true);
            expect(editor.state.doc.child(0).attrs['bg-image']).toBe('/second.png');
        });

        it.each<{initial: string | null; background: Partial<BannerBackground>}>([
            {initial: null, background: {'bg-color': 'blue-light'}},
            {initial: null, background: {'bg-image': '/new-link.png'}},
            {initial: null, background: bannerBackgroundDefaults},
            {initial: '/old.png', background: bannerBackgroundDefaults},
            {initial: '/old.png', background: {'bg-image': '/old.png'}},
        ])(
            'should discard a pending upload after a source choice %j',
            async ({initial, background}) => {
                const editor = createNodeView(':::banner\nText\n:::');
                run(editor, setBannerBackground(0, {'bg-image': initial}));
                const {handler, resolve} = deferred();
                const upload = uploadBannerImage(editor, 0, file, handler);
                run(editor, setBannerBackground(0, background));
                const doc = editor.state.doc;
                resolve({url: '/slow-upload.png'});
                await expect(upload).resolves.toBe(false);
                expect(editor.state.doc).toBe(doc);
            },
        );

        it('should preserve an upload through content, size, theme and blur changes', async () => {
            const editor = createNodeView(':::banner{bg-image="/old.png"}\nText\n:::');
            const {handler, resolve} = deferred();
            const upload = uploadBannerImage(editor, 0, file, handler);
            editor.dispatch(editor.state.tr.insertText('New ', 2));
            run(editor, setBannerDimension(0, 'height', 'l'));
            run(editor, setBannerBackground(0, {'bg-image-theme': 'dark', 'bg-image-blur': true}));
            resolve({url: '/new.png'});
            await expect(upload).resolves.toBe(true);
            expect(editor.state.doc.firstChild?.attrs).toMatchObject({
                height: 'l',
                'bg-image': '/new.png',
                'bg-image-theme': 'dark',
                'bg-image-blur': true,
            });
            expect(editor.state.doc.firstChild?.textContent).toBe('New Text');
        });

        it('should cancel only the upload into the reset banner', async () => {
            const editor = createNodeView(':::banner\n:::\n\n:::banner\n:::');
            const secondPos = editor.state.doc.child(0).nodeSize;
            const first = deferred();
            const second = deferred();
            const firstUpload = uploadBannerImage(editor, 0, file, first.handler);
            const secondUpload = uploadBannerImage(editor, secondPos, file, second.handler);
            run(editor, setBannerBackground(0, bannerBackgroundDefaults));
            first.resolve({url: '/first.png'});
            second.resolve({url: '/second.png'});
            await expect(firstUpload).resolves.toBe(false);
            await expect(secondUpload).resolves.toBe(true);
            expect(editor.state.doc.child(0).attrs['bg-image']).toBeNull();
            expect(editor.state.doc.child(1).attrs['bg-image']).toBe('/second.png');
        });

        it('should finish a cancelled upload before its handler resolves', async () => {
            const editor = createNodeView(':::banner\n:::');
            const {handler, resolve} = deferred();
            const upload = uploadBannerImage(editor, 0, file, handler);
            cancelBannerUploads(editor, 0);
            await expect(upload).resolves.toBe(false);
            resolve({url: '/late.png'});
            await Promise.resolve();
            expect(editor.state.doc.firstChild?.attrs['bg-image']).toBeNull();
        });

        it('should finish a superseded upload before either handler resolves', async () => {
            const editor = createNodeView(':::banner\n:::');
            const first = deferred();
            const second = deferred();
            const firstUpload = uploadBannerImage(editor, 0, file, first.handler);
            const secondUpload = uploadBannerImage(editor, 0, file, second.handler);
            await expect(firstUpload).resolves.toBe(false);
            second.resolve({url: '/new.png'});
            await expect(secondUpload).resolves.toBe(true);
            first.resolve({url: '/late.png'});
            await Promise.resolve();
            expect(editor.state.doc.firstChild?.attrs['bg-image']).toBe('/new.png');
        });

        it('should reject an unsafe uploaded address', async () => {
            const editor = createNodeView(':::banner\n:::');
            const {handler, resolve} = deferred();
            const upload = uploadBannerImage(editor, 0, file, handler);
            resolve({url: 'data:image/svg+xml,<svg/>'});
            await expect(upload).rejects.toThrow();
            expect(editor.state.doc.child(0).attrs['bg-image']).toBeNull();
        });

        const png = new File(['image'], 'a.png', {type: 'image/png'});
        const svg = new File(['image'], 'a.svg', {type: 'image/svg+xml'});
        const text = new File(['text'], 'a.txt', {type: 'text/plain'});

        it.each([
            [png, {}, null],
            [svg, {}, null],
            [text, {}, 'type'],
            [svg, {imageTypes: ['image/jpeg', 'image/png']}, 'type'],
            [png, {imageTypes: ['image/jpeg', 'image/png']}, null],
            [png, {maxImageSize: 5}, null],
            [png, {maxImageSize: 4}, 'size'],
        ])('should check %o against %o', (image, limits, error) => {
            expect(imageFileError(image, limits)).toBe(error);
        });

        it.each([
            [0, '0 B'],
            [1, '1 B'],
            [1023, '1023 B'],
            [1024, '1 KB'],
            [50000, '48.8 KB'],
            [1024 ** 2, '1 MB'],
        ] as const)('should format a limit of %i bytes as %s', (bytes, label) => {
            expect(formatImageSize(bytes)).toBe(label);
        });

        it.each([
            [{}, null],
            [{maxImageSize: 2 * 1024 * 1024}, 'Up to 2 MB'],
            [{maxImageSize: 50000}, 'Up to 48.8 KB'],
            [{maxImageSize: 1}, 'Up to 1 B'],
            [{maxImageSize: 0}, 'Up to 0 B'],
            [{imageTypes: ['image/png']}, 'PNG'],
            [
                {imageTypes: ['image/jpeg', 'image/gif', 'image/png'], maxImageSize: 1536 * 1024},
                'JPEG, GIF or PNG, up to 1.5 MB',
            ],
            [{imageTypes: ['image/svg+xml', 'image/webp']}, 'SVG or WEBP'],
        ])('should build the upload hint from %o', (limits, hint) => {
            expect(uploadHint(limits)).toBe(hint);
        });
    });
});
