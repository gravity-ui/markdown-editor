// @vitest-environment jsdom
import {ExtensionsManager} from '@gravity-ui/markdown-editor/core';
import {
    ReactRenderStorage,
    ReactRendererComponent,
    ReactRendererExtension,
} from '@gravity-ui/markdown-editor/extensions';
import {EditorState, NodeSelection} from '@gravity-ui/markdown-editor/pm/state';
import {EditorView} from '@gravity-ui/markdown-editor/pm/view';
import {BaseSchemaSpecs} from '@gravity-ui/markdown-editor/specs';
import {ThemeProvider} from '@gravity-ui/uikit';
import {type Root, createRoot} from 'react-dom/client';
import {Simulate, act} from 'react-dom/test-utils';
import {afterEach, beforeEach, describe, expect, it, vi} from 'vitest';

import {Banner} from '../../../Banner';

import {isBannerImagePopupOpen} from './plugin';

const png = new File([new Uint8Array(16)], 'a.png', {type: 'image/png'});

function deferred() {
    let resolve!: (url: string) => void;
    const promise = new Promise<{url: string}>((done) => {
        resolve = (url) => done({url});
    });
    return {handler: vi.fn(() => promise), resolve};
}

describe('Banner image window', () => {
    let container: HTMLDivElement;
    let root: Root;
    let view: EditorView | undefined;

    beforeEach(() => {
        vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true);
        container = document.createElement('div');
        document.body.append(container);
        root = createRoot(container);
    });

    afterEach(async () => {
        view?.destroy();
        view?.dom.remove();
        view = undefined;
        await act(async () => root.unmount());
        container.remove();
        vi.unstubAllGlobals();
    });

    // 0 banner 1 image 2 p 3 "Text" 7 /p 8 /banner 9
    async function open(fileUploadHandler?: ReturnType<typeof deferred>['handler']) {
        const storage = new ReactRenderStorage();
        const deps = new ExtensionsManager({
            extensions: (builder) =>
                builder
                    .use(BaseSchemaSpecs, {})
                    .use(ReactRendererExtension, storage)
                    .use(Banner, {
                        fileUploadHandler,
                        imageTypes: ['image/png'],
                        maxImageSize: 1024,
                    }),
        }).build();
        const doc = deps.markupParser.parse(':::banner\n::banner-image\nText\n:::');
        const dom = document.createElement('div');
        document.body.append(dom);
        const editor = new EditorView(dom, {
            state: EditorState.create({
                schema: deps.schema,
                doc,
                plugins: deps.plugins,
                selection: NodeSelection.create(doc, 1),
            }),
            nodeViews: deps.nodeViews,
        });
        view = editor;
        await act(async () => {
            root.render(
                <ThemeProvider>
                    <ReactRendererComponent storage={storage} />
                </ThemeProvider>,
            );
        });
        const event = new KeyboardEvent('keydown', {key: 'Enter', cancelable: true});
        await act(async () => {
            editor.someProp('handleKeyDown', (handler) => handler(editor, event));
        });
        return {editor, serialize: () => deps.serializer.serialize(editor.state.doc)};
    }

    const dialog = () => document.querySelector<HTMLElement>('[data-qa="banner-image"]');

    const button = (text: string) => {
        const found = Array.from(dialog()?.querySelectorAll('button') ?? []).find(
            (element) => element.textContent === text,
        );
        if (!found) throw new Error(`Button "${text}" is missing`);
        return found;
    };

    async function submitLink(url: string) {
        const input = dialog()?.querySelector<HTMLInputElement>('input[placeholder="https://"]');
        if (!input) throw new Error('Link input is missing');
        await act(async () => {
            input.value = url;
            Simulate.change(input);
        });
        await act(async () => button('Submit').click());
    }

    async function attach(file: File) {
        const input = dialog()?.querySelector<HTMLInputElement>('input[type="file"]');
        if (!input) throw new Error('File input is missing');
        Object.defineProperty(input, 'files', {value: [file], configurable: true});
        await act(async () => Simulate.change(input));
    }

    const src = (editor: EditorView, pos = 1) => editor.state.doc.nodeAt(pos)?.attrs.src;

    it('should set the image by a link and reject an unsafe one', async () => {
        const {editor} = await open();
        expect(dialog()).not.toBeNull();
        expect(dialog()?.querySelector('input[type="file"]')).toBeNull();
        await submitLink(['javascript', 'alert(1)'].join(':'));
        expect(src(editor)).toBeNull();
        await submitLink('https://example.com/a.png');
        expect(src(editor)).toBe('https://example.com/a.png');
        expect(isBannerImagePopupOpen(editor.state)).toBe(true);
    });

    it('should reset the image', async () => {
        const {editor} = await open();
        await submitLink('https://example.com/a.png');
        await act(async () => button('Reset').click());
        expect(src(editor)).toBeNull();
    });

    it('should set the uploaded image', async () => {
        const upload = deferred();
        const {editor, serialize} = await open(upload.handler);
        await attach(png);
        expect(upload.handler).toHaveBeenCalledWith(png);
        await act(async () => upload.resolve('https://example.com/up.png'));
        expect(src(editor)).toBe('https://example.com/up.png');
        expect(serialize()).toContain('::banner-image{src="https://example.com/up.png"}');
    });

    it('should drop the upload on cancel', async () => {
        const upload = deferred();
        const {editor} = await open(upload.handler);
        await attach(png);
        await act(async () => button('Cancel').click());
        expect(isBannerImagePopupOpen(editor.state)).toBe(false);
        await act(async () => upload.resolve('https://example.com/up.png'));
        expect(src(editor)).toBeNull();
    });

    it('should keep a link set in the window during the upload', async () => {
        const upload = deferred();
        const {editor} = await open(upload.handler);
        await attach(png);
        const linkTab = dialog()?.querySelector<HTMLElement>('[role="tab"][title="Add by link"]');
        await act(async () => linkTab?.click());
        await submitLink('https://example.com/b.png');
        await act(async () => upload.resolve('https://example.com/up.png'));
        expect(src(editor)).toBe('https://example.com/b.png');
    });

    it('should set the upload to the moved image', async () => {
        const upload = deferred();
        const {editor} = await open(upload.handler);
        await attach(png);
        await act(async () => {
            editor.dispatch(
                editor.state.tr.insert(0, editor.state.schema.nodes.paragraph.create()),
            );
        });
        await act(async () => upload.resolve('https://example.com/up.png'));
        expect(src(editor, 3)).toBe('https://example.com/up.png');
    });

    it('should drop the upload of a removed image', async () => {
        const upload = deferred();
        const {editor, serialize} = await open(upload.handler);
        await attach(png);
        await act(async () => {
            editor.dispatch(editor.state.tr.delete(1, 2));
        });
        const doc = editor.state.doc;
        await act(async () => upload.resolve('https://example.com/up.png'));
        expect(editor.state.doc).toBe(doc);
        expect(serialize()).not.toContain('banner-image');
    });
});
