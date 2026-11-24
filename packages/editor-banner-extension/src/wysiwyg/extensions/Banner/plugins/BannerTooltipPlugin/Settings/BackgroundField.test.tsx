// @vitest-environment jsdom
import {ExtensionsManager} from '@gravity-ui/markdown-editor/core';
import {
    ReactRenderStorage,
    ReactRendererComponent,
    ReactRendererExtension,
} from '@gravity-ui/markdown-editor/extensions';
import {history, undo} from '@gravity-ui/markdown-editor/pm/history';
import {EditorState, TextSelection} from '@gravity-ui/markdown-editor/pm/state';
import {EditorView} from '@gravity-ui/markdown-editor/pm/view';
import {BaseSchemaSpecs} from '@gravity-ui/markdown-editor/specs';
import {ThemeProvider} from '@gravity-ui/uikit';
import {type Root, createRoot} from 'react-dom/client';
import {Simulate, act} from 'react-dom/test-utils';
import {afterEach, beforeEach, describe, expect, it, vi} from 'vitest';

import {hasBannerUploads} from '../../../../../plugins/BannerUploadPlugin';
import {Banner} from '../../../index';

const scriptUrl = ['javascript', 'alert(1)'].join(':');
const png = (size = 16) => new File([new Uint8Array(size)], 'a.png', {type: 'image/png'});

type Upload = {resolve: (url: string) => void; reject: (error: Error) => void};

describe('Banner background settings', () => {
    let container: HTMLDivElement;
    let root: Root;
    let view: EditorView | undefined;
    let uploads: Upload[];
    const fileUploadHandler = vi.fn(
        () =>
            new Promise<{url: string}>((resolve, reject) => {
                uploads.push({resolve: (url) => resolve({url}), reject});
            }),
    );

    beforeEach(() => {
        vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true);
        container = document.createElement('div');
        document.body.append(container);
        root = createRoot(container);
        uploads = [];
        vi.clearAllMocks();
    });

    afterEach(async () => {
        view?.destroy();
        view?.dom.remove();
        view = undefined;
        await act(async () => root.unmount());
        container.remove();
        vi.unstubAllGlobals();
    });

    const dialog = (qa: string) => document.querySelector<HTMLElement>(`[data-qa="${qa}"]`);

    function control(scope: ParentNode | null, selector: string, name: string) {
        const found = Array.from(scope?.querySelectorAll<HTMLElement>(selector) ?? []).find(
            (element) => (element.getAttribute('aria-label') ?? element.textContent) === name,
        );
        if (!found) throw new Error(`"${name}" is missing`);
        return found;
    }

    const popup = () => dialog('banner-background');
    const click = (element: HTMLElement) => act(async () => element.click());

    // 0 banner 1 p 2 "Text" 6 /p 7 /banner 8
    async function openImageTab() {
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
        const doc = deps.markupParser.parse(':::banner\nText\n:::');
        const dom = document.createElement('div');
        document.body.append(dom);
        const editor = new EditorView(dom, {
            state: EditorState.create({
                schema: deps.schema,
                doc,
                plugins: [...deps.plugins, history()],
                selection: TextSelection.create(doc, 2),
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
        await act(async () => editor.dispatch(editor.state.tr));
        await click(control(dialog('g-md-toolbar-banner'), 'button', 'Settings'));
        await click(
            control(dialog('banner-settings'), '[aria-haspopup="dialog"]', 'No background'),
        );
        await click(control(popup(), '[role="tab"]', 'Image'));
        return editor;
    }

    async function attach(file: File) {
        const input = popup()?.querySelector<HTMLInputElement>('input[type="file"]');
        if (!input) throw new Error('File input is missing');
        Object.defineProperty(input, 'files', {value: [file], configurable: true});
        await act(async () => Simulate.change(input));
    }

    const finish = (url: string) => act(async () => uploads[0].resolve(url));
    const background = (editor: EditorView) => editor.state.doc.lastChild?.attrs;
    const alertText = () => popup()?.querySelector('[role="alert"]')?.textContent ?? null;

    it('should write the uploaded image after the banner moves, in one undo step', async () => {
        const editor = await openImageTab();
        await attach(png());
        await act(async () => {
            editor.dispatch(
                editor.state.tr.insert(0, editor.state.schema.nodes.paragraph.create()),
            );
        });
        await finish('https://example.com/a.png');
        expect(background(editor)?.['bg-image']).toBe('https://example.com/a.png');

        expect(undo(editor.state, editor.dispatch)).toBe(true);
        expect(background(editor)?.['bg-image']).toBeNull();
        expect(editor.state.doc.childCount).toBe(2);
    });

    it.each([
        ['closing the window', [['button', 'Close']], {}],
        ['resetting the background', [['button', 'Reset']], {}],
        [
            'choosing a fill',
            [
                ['[role="tab"]', 'Fill'],
                ['[role="radio"]', 'Blue 20%'],
            ],
            {'bg-color': 'blue-light'},
        ],
    ])('should cancel the upload by %s', async (_name, clicks, expected) => {
        const editor = await openImageTab();
        await attach(png());
        for (const [selector, name] of clicks) await click(control(popup(), selector, name));
        expect(hasBannerUploads(editor.state, 0)).toBe(false);
        await finish('https://example.com/a.png');
        expect(background(editor)).toMatchObject({'bg-image': null, 'bg-color': null, ...expected});
    });

    it.each([
        [
            'a file of an unsupported format',
            new File(['a'], 'a.txt', {type: 'text/plain'}),
            'Unsupported file format',
        ],
        ['a file over the size limit', png(2048), 'The file is larger than 1 KB'],
    ])('should reject %s before the upload', async (_name, file, error) => {
        const editor = await openImageTab();
        await attach(file);
        expect(alertText()).toBe(error);
        expect(fileUploadHandler).not.toHaveBeenCalled();
        expect(background(editor)?.['bg-image']).toBeNull();
    });

    it.each([
        ['fails', (upload: Upload) => upload.reject(new Error('Network'))],
        ['returns an unsafe address', (upload: Upload) => upload.resolve(scriptUrl)],
    ])('should keep the background when the upload %s', async (_name, settle) => {
        const editor = await openImageTab();
        await attach(png());
        await act(async () => settle(uploads[0]));
        expect(alertText()).toBe('Failed to upload the file');
        expect(background(editor)?.['bg-image']).toBeNull();
        expect(hasBannerUploads(editor.state, 0)).toBe(false);
    });
});
